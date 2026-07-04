from typing import Annotated, TypedDict, List, Dict, Any, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    # Core conversation state
    messages: Annotated[List[BaseMessage], add_messages]
    
    # Custom memory state
    selected_candidate: Optional[str]
    current_workflow: Optional[str]
    last_ui: Optional[Dict[str, Any]]
    pending_action: Optional[str]
    
    # Internal agent processing state
    intent: Optional[str]
    plan: Optional[str]
    selected_tool: Optional[str]
    tool_payload: Optional[Dict[str, Any]]
    mcp_result: Optional[Dict[str, Any]]
    final_response: Optional[str]
