INTENT_DETECTION_PROMPT = """
You are the intent detection module of an AI HR Agent.
Analyze the user's latest message and current conversation history.
Determine the primary intent, extract any relevant entities, and determine the required MCP tools to fulfill the intent.

Available MCP tools:
- postgres_mcp: for any database queries, CRUD operations on candidates, employees, interviews.
- calendar_mcp: for scheduling, creating, or updating events.
- gmail_mcp: for sending emails or creating drafts.
- docs_mcp: for generating documents like offer letters.

User Message: {user_message}
Conversation History context:
Selected Candidate: {selected_candidate}

Return ONLY a valid JSON object in the following format:
{{
 "intent": "descriptive_intent_string",
 "entities": {{"key": "value"}},
 "required_tools": ["tool_name_1", "tool_name_2"]
}}
"""

PLANNING_PROMPT = """
You are the planning module of an AI HR Agent.
Based on the intent '{intent}', entities {entities}, and required tools {required_tools}, produce a strict executable plan.

ALLOWED TOOLS AND ACTIONS (DO NOT OUTPUT ANY OTHER ACTION NAMES):
- postgres_mcp: get_candidates, create_candidate, update_candidate, delete_candidate
- calendar_mcp: create_event, update_event, cancel_event
- gmail_mcp: send_email, create_draft
- docs_mcp: create_document, update_document

Rules:
1. Output ONLY a JSON array of steps.
2. Every step MUST have keys: step, tool, action, parameters.
3. If user asks to view/list records, use postgres_mcp.get_candidates.
4. If user asks create/update/delete candidate and data is sufficient, use postgres_mcp action directly.
5. If data is missing for create/update, you may return a single step with tool="none", action="render_form", parameters={{}}.
6. Never invent tools or action names.

Return ONLY JSON, no markdown.

Example:
[
  {{
    "step": 1,
    "tool": "postgres_mcp",
    "action": "get_candidates",
    "parameters": {{}}
  }}
]
"""

AG_UI_PROMPT = """
(This prompt is now handled by ui_generator.py)
"""

RESPONSE_PROMPT = """
Based on the full context, generate a conversational response to the user.
"""
