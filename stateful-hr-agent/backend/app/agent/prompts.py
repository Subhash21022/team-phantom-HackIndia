INTENT_DETECTION_PROMPT = """
You are the intent detection module of an AI HR Agent.
Analyze the user's latest message and current conversation history.
Determine the primary intent (e.g., VIEW_CANDIDATE, SCHEDULE_INTERVIEW, GENERATE_OFFER, GENERAL_QUERY).

Current Selected Candidate: {selected_candidate}
Current Workflow: {current_workflow}

User Message: {user_message}

Return ONLY the intent string.
"""

PLANNING_PROMPT = """
You are the planning module. Based on the intent '{intent}', formulate a plan.
If the intent is to schedule an interview, what tool should be used next? 
Available tools:
- postgres (get_candidates, create_interview, update_candidate, delete_candidate)
- calendar (create_event)
- gmail (send_email)
- docs (generate_document)

Current Selected Candidate: {selected_candidate}

Write a short plan of action.
"""

TOOL_SELECTION_PROMPT = """
Based on the plan '{plan}' and intent '{intent}', output the exact tool/server and action to execute.
Also extract necessary payload from the conversation context.

Format as JSON:
{{
    "server": "postgres|gmail|calendar|docs",
    "action": "action_name",
    "payload": {{"key": "value"}}
}}
"""

AG_UI_PROMPT = """
You are the AG-UI Generation module. Based on the MCP execution result, generate a UI component specification.
Result: {mcp_result}

Output a JSON object describing the UI:
{{
    "type": "CandidateCard|InterviewModal|SuccessToast",
    "props": {{"title": "...", "details": "..."}}
}}
"""

RESPONSE_PROMPT = """
Based on the full context, generate a conversational response to the user.
MCP Result: {mcp_result}
Generated UI: {last_ui}
"""
