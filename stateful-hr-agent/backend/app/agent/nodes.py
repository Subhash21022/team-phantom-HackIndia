import json
import re
from copy import deepcopy
from typing import Any, Dict, List, Optional, Tuple

from langchain_core.messages import AIMessage

from app.agent.prompts import INTENT_DETECTION_PROMPT, PLANNING_PROMPT
from app.agent.state import AgentState
from app.agent.ui_generator import generate_ui
from app.mcp.client import mcp_client
from app.services.llm import get_agent_llm, get_fast_llm

# LLMs are lazily initialized
_core_llm = None
_content_llm = None


def get_core_llm():
    global _core_llm
    if _core_llm is None:
        _core_llm = get_agent_llm()
    return _core_llm


def get_content_llm():
    global _content_llm
    if _content_llm is None:
        _content_llm = get_fast_llm()
    return _content_llm


def clean_json_response(content: str) -> str:
    cleaned = content.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return cleaned.strip()


ALLOWED_ACTIONS: Dict[str, set] = {
    "postgres_mcp": {"get_candidates", "create_candidate", "update_candidate", "delete_candidate"},
    "calendar_mcp": {"create_event", "update_event", "cancel_event"},
    "gmail_mcp": {"send_email", "create_draft"},
    "docs_mcp": {"create_document", "update_document"},
}

TOOL_ALIASES = {
    "postgres": "postgres_mcp",
    "postgres_mcp": "postgres_mcp",
    "calendar": "calendar_mcp",
    "calendar_mcp": "calendar_mcp",
    "gmail": "gmail_mcp",
    "gmail_mcp": "gmail_mcp",
    "docs": "docs_mcp",
    "docs_mcp": "docs_mcp",
    "none": "none",
}

ACTION_ALIASES = {
    "update_record": "update_candidate",
    "modify_candidate": "update_candidate",
    "database_update": "update_candidate",
    "edit_candidate": "update_candidate",
    "get_records": "get_candidates",
    "list_candidates": "get_candidates",
    "view_candidates": "get_candidates",
    "remove_candidate": "delete_candidate",
    "schedule_interview": "create_event",
    "book_meeting": "create_event",
    "generate_document": "create_document",
    "reschedule_interview": "update_event",
}


def _log_step(step_no: int, title: str, content: Any) -> None:
    rendered = content if isinstance(content, str) else json.dumps(content, indent=2, ensure_ascii=False)
    print(f"\n[{step_no}] {title}\n{rendered}")


def _extract_candidate_from_text(text: str) -> Dict[str, Any]:
    raw = (text or "").strip()

    create_match = re.search(
        r"(?:create|add)\s+candidate\s+([A-Za-z][A-Za-z .'-]+?)(?:,\s*|\s+as\s+|\s+for\s+)([A-Za-z][A-Za-z0-9 /&()\-]+)",
        raw,
        flags=re.IGNORECASE,
    )
    if create_match:
        name = create_match.group(1).strip()
        role = create_match.group(2).strip()
        email = f"{re.sub(r'[^a-z0-9]+', '.', name.lower()).strip('.')}@example.com"
        return {"name": name, "role": role, "email": email}

    update_match = re.search(
        r"(?:change|update|set)\s+([A-Za-z][A-Za-z .'-]+?)\s+status\s+(?:to|as)\s+([A-Za-z][A-Za-z0-9 _-]+)",
        raw,
        flags=re.IGNORECASE,
    )
    if update_match:
        return {"name": update_match.group(1).strip(), "field": "status", "value": update_match.group(2).strip()}

    delete_match = re.search(r"(?:delete|remove)\s+([A-Za-z][A-Za-z .'-]+)$", raw, flags=re.IGNORECASE)
    if delete_match:
        return {"name": delete_match.group(1).strip()}

    return {}


def _normalize_tool(tool_raw: str) -> str:
    return TOOL_ALIASES.get((tool_raw or "").strip().lower(), (tool_raw or "").strip().lower())


def _normalize_action(action_raw: str) -> str:
    base = (action_raw or "").strip().lower()
    return ACTION_ALIASES.get(base, base)


def _normalize_plan(raw_plan: List[Dict[str, Any]], entities: Dict[str, Any], user_message: str) -> List[Dict[str, Any]]:
    normalized: List[Dict[str, Any]] = []
    candidate_name = entities.get("candidate") or entities.get("name") or entities.get("candidate_name")

    for idx, step in enumerate(raw_plan or [], start=1):
        tool = _normalize_tool(str(step.get("tool", "")))
        action = _normalize_action(str(step.get("action", "")))
        params = step.get("parameters") or {}

        if tool == "none":
            normalized.append({"step": idx, "tool": "none", "action": action or "render_form", "parameters": params})
            continue

        if tool not in ALLOWED_ACTIONS:
            continue
        if action not in ALLOWED_ACTIONS[tool]:
            continue

        params = deepcopy(params)
        if candidate_name and "name" not in params:
            params["name"] = candidate_name
        normalized.append({"step": idx, "tool": tool, "action": action, "parameters": params})

    if not normalized:
        low = (user_message or "").lower()
        if "delete" in low or "remove" in low:
            normalized = [{"step": 1, "tool": "postgres_mcp", "action": "delete_candidate", "parameters": _extract_candidate_from_text(user_message)}]
        elif "change" in low or "update" in low or "status" in low:
            parsed = _extract_candidate_from_text(user_message)
            params = {"name": parsed.get("name"), parsed.get("field", "status"): parsed.get("value")} if parsed else {}
            normalized = [{"step": 1, "tool": "postgres_mcp", "action": "update_candidate", "parameters": params}]
        elif "create candidate" in low or "add candidate" in low:
            normalized = [{"step": 1, "tool": "postgres_mcp", "action": "create_candidate", "parameters": _extract_candidate_from_text(user_message)}]
        elif "candidate" in low:
            normalized = [{"step": 1, "tool": "postgres_mcp", "action": "get_candidates", "parameters": {}}]

    needs_candidate_ctx = any(
        s["tool"] in {"calendar_mcp", "gmail_mcp"} and s["action"] in {"create_event", "update_event", "cancel_event", "send_email", "create_draft"}
        for s in normalized
    )
    has_lookup = any(s["tool"] == "postgres_mcp" and s["action"] == "get_candidates" for s in normalized)
    if needs_candidate_ctx and not has_lookup:
        first_name = candidate_name or _extract_candidate_from_text(user_message).get("name")
        normalized.insert(0, {"step": 0, "tool": "postgres_mcp", "action": "get_candidates", "parameters": {"name": first_name} if first_name else {}})

    for i, s in enumerate(normalized, start=1):
        s["step"] = i

    return normalized


def _get_candidate_name(state: AgentState) -> Optional[str]:
    entities = state.get("entities") or {}
    if isinstance(entities, dict):
        return entities.get("candidate") or entities.get("name") or entities.get("candidate_name")
    return None


def _apply_update_shape(payload: Dict[str, Any]) -> Dict[str, Any]:
    if "data" in payload and isinstance(payload["data"], dict):
        return payload
    known_fields = {"name", "email", "phone", "role", "skills", "experience", "status", "resume_url"}
    data = {k: v for k, v in payload.items() if k in known_fields and v is not None}
    passthrough = {k: v for k, v in payload.items() if k not in known_fields}
    passthrough["data"] = data
    return passthrough


def _coerce_create_payload(payload: Dict[str, Any], user_message: str) -> Dict[str, Any]:
    p = dict(payload or {})
    parsed = _extract_candidate_from_text(user_message)
    for key in ("name", "email", "role"):
        if not p.get(key) and parsed.get(key):
            p[key] = parsed[key]

    if p.get("name") and not p.get("email"):
        p["email"] = f"{re.sub(r'[^a-z0-9]+', '.', str(p['name']).lower()).strip('.')}@example.com"
    if not p.get("role"):
        p["role"] = "Generalist"
    if "status" not in p:
        p["status"] = "applied"
    return p


async def _resolve_candidate_id(payload: Dict[str, Any], candidate_name: Optional[str]) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    if payload.get("id"):
        return payload, {}

    name = payload.get("name") or candidate_name
    if not name:
        return payload, {}

    lookup = await mcp_client.execute("postgres_mcp", "get_candidates", {"name": name})
    if lookup.get("status") != "success":
        return payload, {}

    found = None
    for row in lookup.get("data", []):
        row_name = str(row.get("name", "")).strip().lower()
        target = str(name).strip().lower()
        if row_name == target:
            found = row
            break
        if target in row_name:
            found = row
    if found:
        payload = dict(payload)
        payload["id"] = found.get("id")
        return payload, {"candidate_id": found.get("id"), "candidate_email": found.get("email"), "candidate_name": found.get("name")}

    return payload, {}


async def input_node(state: AgentState) -> AgentState:
    user_message = state["messages"][-1].content
    _log_step(1, "INPUT", user_message)
    return state


async def intent_detection(state: AgentState) -> AgentState:
    user_message = state["messages"][-1].content
    prompt = INTENT_DETECTION_PROMPT.format(
        selected_candidate=state.get("selected_candidate", "None"),
        user_message=user_message,
    )
    response = await get_core_llm().ainvoke(prompt)
    try:
        raw_json = clean_json_response(response.content)
        data = json.loads(raw_json)

        intent = data.get("intent", "UNKNOWN")
        entities = data.get("entities", {})
        if not isinstance(entities, dict):
            entities = {}

        entities = {**_extract_candidate_from_text(user_message), **entities}
        required_tools = data.get("required_tools", [])

        _log_step(2, "INTENT", {"intent": intent, "entities": entities, "required_tools": required_tools})

        return {
            "intent": intent,
            "entities": entities,
            "required_tools": required_tools,
        }
    except Exception as e:
        _log_step(2, "INTENT", {"intent": "ERROR", "error": str(e)})
        return {"intent": "ERROR", "entities": {}, "required_tools": []}


async def memory_retrieval(state: AgentState) -> AgentState:
    return state


async def planning_node(state: AgentState) -> AgentState:
    intent = state.get("intent", "")
    entities = state.get("entities", {})
    required_tools = state.get("required_tools", [])
    user_message = state["messages"][-1].content

    prompt = PLANNING_PROMPT.format(
        intent=intent,
        entities=json.dumps(entities),
        required_tools=json.dumps(required_tools),
    )

    response = await get_core_llm().ainvoke(prompt)
    try:
        raw_json = clean_json_response(response.content)
        raw_plan = json.loads(raw_json)
        if not isinstance(raw_plan, list):
            raw_plan = []

        plan = _normalize_plan(raw_plan, entities or {}, user_message)
        _log_step(3, "PLAN", plan)
        return {"plan": plan}
    except Exception as e:
        fallback_plan = _normalize_plan([], entities or {}, user_message)
        _log_step(3, "PLAN", {"error": str(e), "fallback_plan": fallback_plan})
        return {"plan": fallback_plan}


async def mcp_execution(state: AgentState) -> AgentState:
    plan = state.get("plan", [])
    selected_candidate = state.get("selected_candidate")
    entities = state.get("entities", {})
    user_message = state["messages"][-1].content

    if isinstance(entities, dict) and "candidate" in entities:
        selected_candidate = entities["candidate"]

    results = []
    context: Dict[str, Any] = {}

    for step in plan:
        tool_raw = step.get("tool", "")
        if tool_raw == "none":
            continue

        tool = _normalize_tool(tool_raw)
        action = _normalize_action(step.get("action", ""))

        if tool not in ALLOWED_ACTIONS or action not in ALLOWED_ACTIONS[tool]:
            skipped = {"status": "error", "message": f"Unsupported action '{action}' for tool '{tool}'"}
            _log_step(4, "MCP CALL", {"tool": tool, "action": action, "skipped": True})
            _log_step(5, "MCP RESULT", skipped)
            results.append({"step": step.get("step"), "server": tool, "action": action, "result": skipped})
            continue

        payload = dict(step.get("parameters", {}) or {})

        if "candidate_id" in context and "candidate_id" not in payload:
            payload["candidate_id"] = context["candidate_id"]
        if "candidate_email" in context and "to" not in payload:
            payload["to"] = context["candidate_email"]
        if "candidate_name" in context and "candidate_name" not in payload:
            payload["candidate_name"] = context["candidate_name"]

        if tool == "postgres_mcp" and action == "create_candidate":
            payload = _coerce_create_payload(payload, user_message)

        if tool == "postgres_mcp" and action in {"update_candidate", "delete_candidate"}:
            payload, resolved_ctx = await _resolve_candidate_id(payload, _get_candidate_name(state) or selected_candidate)
            context.update({k: v for k, v in resolved_ctx.items() if v})

        if tool == "postgres_mcp" and action == "update_candidate":
            field = payload.pop("field", None)
            value = payload.pop("value", None)
            if field and value is not None and field not in payload:
                payload[field] = value
            payload = _apply_update_shape(payload)

        if tool == "gmail_mcp" and action == "send_email" and not payload.get("body"):
            content_prompt = f"Write a professional HR email regarding an interview for {payload.get('to', selected_candidate)}. Keep it concise."
            res = await get_content_llm().ainvoke(content_prompt)
            payload["body"] = res.content

        if tool == "docs_mcp" and action == "create_document" and not payload.get("content"):
            content_prompt = f"Write a professional HR Offer Letter for {payload.get('candidate_name', selected_candidate)}. Include a warm welcome and standard placeholder terms."
            res = await get_content_llm().ainvoke(content_prompt)
            payload["content"] = res.content

        if tool == "calendar_mcp" and action == "create_event":
            payload.setdefault("title", "Interview Schedule")
            payload.setdefault("start_time", "2026-07-06T10:00:00Z")
            if payload.get("to") and "attendees" not in payload:
                payload["attendees"] = [payload["to"]]

        _log_step(4, "MCP CALL", {"calling": f"{tool}.{action}()", "payload": payload})

        try:
            result = await mcp_client.execute(tool, action, payload)

            if tool == "postgres_mcp" and action == "get_candidates" and result.get("status") == "success":
                data = result.get("data", [])
                if data and isinstance(data, list):
                    name_pref = (payload.get("name") or _get_candidate_name(state) or "").strip().lower()
                    selected = data[0]
                    for row in data:
                        rn = str(row.get("name", "")).strip().lower()
                        if name_pref and rn == name_pref:
                            selected = row
                            break
                    context["candidate_id"] = selected.get("id")
                    context["candidate_email"] = selected.get("email")
                    context["candidate_name"] = selected.get("name")

            if tool == "postgres_mcp" and action == "create_candidate" and result.get("status") == "success":
                new_data = result.get("data", {})
                context["candidate_id"] = new_data.get("id")
                context["candidate_name"] = new_data.get("name") or payload.get("name")
                context["candidate_email"] = payload.get("email")

        except Exception as e:
            result = {"status": "error", "message": str(e)}

        _log_step(5, "MCP RESULT", result)

        results.append(
            {
                "step": step.get("step"),
                "server": tool,
                "action": action,
                "result": result,
            }
        )

    return {
        "mcp_results": results,
        "selected_candidate": selected_candidate,
    }


async def ag_ui_generation(state: AgentState) -> AgentState:
    mcp_results = state.get("mcp_results", [])
    intent = state.get("intent", "")

    context_data = {
        "intent": intent,
        "entities": state.get("entities", {}),
        "plan": state.get("plan", []),
        "mcp_results": mcp_results,
        "selected_candidate": state.get("selected_candidate"),
    }

    ui_data = await generate_ui(context_data)
    _log_step(6, "AG-UI GENERATED", {"type": ui_data.get("type")})
    return {"last_ui": ui_data}


async def response_node(state: AgentState) -> AgentState:
    return {"messages": [AIMessage(content="")]}
