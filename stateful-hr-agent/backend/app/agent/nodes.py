import json
from langchain_core.messages import AIMessage
from langchain_openai import ChatOpenAI
from app.agent.state import AgentState
from app.agent.prompts import (
    INTENT_DETECTION_PROMPT, 
    PLANNING_PROMPT, 
    TOOL_SELECTION_PROMPT, 
    AG_UI_PROMPT,
    RESPONSE_PROMPT
)
from app.mcp.client import mcp_client

# Initialize LLM
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)

async def input_node(state: AgentState) -> AgentState:
    # Passthrough
    return state

async def intent_detection(state: AgentState) -> AgentState:
    user_message = state["messages"][-1].content
    prompt = INTENT_DETECTION_PROMPT.format(
        selected_candidate=state.get("selected_candidate"),
        current_workflow=state.get("current_workflow"),
        user_message=user_message
    )
    response = await llm.ainvoke(prompt)
    return {"intent": response.content.strip()}

async def planning_node(state: AgentState) -> AgentState:
    prompt = PLANNING_PROMPT.format(
        intent=state.get("intent"),
        selected_candidate=state.get("selected_candidate")
    )
    response = await llm.ainvoke(prompt)
    return {"plan": response.content.strip()}

async def tool_selection(state: AgentState) -> AgentState:
    prompt = TOOL_SELECTION_PROMPT.format(
        intent=state.get("intent"),
        plan=state.get("plan")
    )
    response = await llm.ainvoke(prompt)
    try:
        raw_content = response.content.replace("```json", "").replace("```", "").strip()
        tool_data = json.loads(raw_content)
        return {
            "selected_tool": tool_data.get("server"),
            "tool_payload": tool_data
        }
    except Exception:
        return {"selected_tool": None, "tool_payload": None}

async def mcp_execution(state: AgentState) -> AgentState:
    tool_payload = state.get("tool_payload")
    if not tool_payload:
        return {"mcp_result": {"status": "error", "message": "No tool selected"}}
        
    server = tool_payload.get("server")
    action = tool_payload.get("action")
    payload = tool_payload.get("payload", {})
    
    # State update simulation based on intent & action
    selected_candidate = state.get("selected_candidate")
    if action == "get_candidates" and "name" in payload:
        # User is looking up someone, update state
        selected_candidate = payload["name"]
        
    result = await mcp_client.execute(server, action, payload)
    
    return {
        "mcp_result": result,
        "selected_candidate": selected_candidate
    }

from app.agent.ui_generator import generate_ui

async def ag_ui_generation(state: AgentState) -> AgentState:
    mcp_result = state.get("mcp_result", {})
    intent = state.get("intent", "")
    
    # Bundle context data to give the UI Generator enough information
    context_data = {
        "mcp_result": mcp_result,
        "intent": intent,
        "selected_candidate": state.get("selected_candidate")
    }
    
    ui_data = await generate_ui(context_data)
    return {"last_ui": ui_data}

async def response_node(state: AgentState) -> AgentState:
    prompt = RESPONSE_PROMPT.format(
        mcp_result=state.get("mcp_result"),
        last_ui=state.get("last_ui")
    )
    response = await llm.ainvoke(prompt)
    return {"messages": [AIMessage(content=response.content)]}
