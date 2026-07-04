import json
import os
from typing import Dict, Any
from langchain_openai import AzureChatOpenAI
from langchain_core.prompts import PromptTemplate
from app.services.llm import get_agent_llm

# LLM is lazily initialized to ensure env vars are loaded before first use
_core_llm = None

def _get_llm():
    global _core_llm
    if _core_llm is None:
        _core_llm = get_agent_llm()
    return _core_llm

UI_GENERATION_PROMPT = """
You are the AG-UI (AI-Generated UI) system.
Based on the provided data and context, you must generate a JSON object representing the UI component to be rendered on the frontend.

IMPORTANT AG-UI RENDERING CORRECTION:
The frontend should NOT display raw JSON or simple data cards.
AG-UI JSON is only the instruction layer.
React must convert the AG-UI schema into real interactive components.

You are restricted to the following UI Component types:
- table
- form
- calendar
- dashboard_card
- timeline
- document_preview

Return ONLY a valid JSON object. Do not include markdown blocks like ```json ... ```. 
Ensure the JSON is perfectly parseable.

Context Data from MCP or Agent:
{context_data}

Rules for generation based on Context:
1. If intent is CREATE_CANDIDATE or UPDATE_CANDIDATE and mcp_results has no success data, output a form with fields (name, email, role, experience, status) and submit_action 'create_candidate' (or update_candidate). For UPDATE_CANDIDATE, you MUST include a hidden field for "id" and you MUST populate the "value" property for all fields using the candidate's existing data from the context.
2. If intent is VIEW_CANDIDATES or a get_candidates action succeeded in mcp_results, output a table. Make sure the table has columns (key, label), rows, and an actions array mapping labels to events. (e.g., event: "edit_candidate"). The frontend will render a real enterprise HR table based on this data.
3. If an action succeeded (like delete or create or update), output a dashboard_card summarizing the success.

Example Table JSON:
{{
 "type": "table",
 "title": "Candidate Management",
 "columns": [
   {{"key": "name", "label": "Candidate Name"}},
   {{"key": "role", "label": "Position"}},
   {{"key": "experience", "label": "Experience"}},
   {{"key": "status", "label": "Status"}}
 ],
 "rows": [
  {{
   "id": 1,
   "name": "Rahul Sharma",
   "role": "Frontend Developer",
   "experience": "3 Years",
   "status": "Screening"
  }}
 ],
 "actions": [
  {{"label": "Edit", "event": "edit_candidate"}},
  {{"label": "Delete", "event": "delete_candidate"}},
  {{"label": "Schedule Interview", "event": "schedule_interview"}}
 ]
}}

Example Form JSON:
{{
  "type": "form",
  "title": "Add Candidate",
  "fields": [
    {{"name": "name", "type": "text"}},
    {{"name": "email", "type": "email"}},
    {{"name": "role", "type": "text"}}
  ],
  "submit_action": "create_candidate"
}}

Generate the appropriate JSON:
"""

async def generate_ui(context_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Generates a UI JSON structure based on the provided context data.
    """
    prompt = PromptTemplate(
        input_variables=["context_data"],
        template=UI_GENERATION_PROMPT
    )
    
    formatted_prompt = prompt.format(context_data=json.dumps(context_data, indent=2))
    
    response = await _get_llm().ainvoke(formatted_prompt)
    
    try:
        raw_content = response.content.strip()
        # Clean up any potential markdown formatting from LLM
        if raw_content.startswith("```json"):
            raw_content = raw_content[7:]
        if raw_content.startswith("```"):
            raw_content = raw_content[3:]
        if raw_content.endswith("```"):
            raw_content = raw_content[:-3]
            
        ui_json = json.loads(raw_content.strip())
        return ui_json
    except Exception as e:
        # Fallback UI if parsing fails
        return {
            "type": "dashboard_card",
            "title": "Error generating UI",
            "content": f"Failed to parse UI JSON: {str(e)}",
            "raw_data": context_data
        }
