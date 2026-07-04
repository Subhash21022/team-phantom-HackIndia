from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.agent.graph import hr_agent_app
from langchain_core.messages import HumanMessage

router = APIRouter(prefix="/api/chat", tags=["chat"])

class ChatRequest(BaseModel):
    message: str
    thread_id: str = "default_thread"

@router.post("/")
async def chat_endpoint(request: ChatRequest):
    # Setup initial state for the LangGraph
    config = {"configurable": {"thread_id": request.thread_id}}
    
    initial_state = {
        "messages": [HumanMessage(content=request.message)]
    }
    
    # Run the graph asynchronously
    result = await hr_agent_app.ainvoke(initial_state, config)
    
    # Extract final response and generated UI config
    messages = result.get("messages", [])
    last_ui = result.get("last_ui", None)
    
    response_text = "I'm sorry, I couldn't process that request."
    if messages and len(messages) > 1:
        # Get the last AI message
        response_text = messages[-1].content
        
    return {
        "response": response_text,
        "ui": last_ui
    }
