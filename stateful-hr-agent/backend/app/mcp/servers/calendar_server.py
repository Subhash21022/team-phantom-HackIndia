from typing import Dict, Any

async def execute_calendar(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mock Calendar MCP Server
    Will be replaced by a real Google Calendar/Outlook MCP integration later.
    """
    if action == "create_event":
        title = payload.get("title")
        start_time = payload.get("start_time")
        attendees = payload.get("attendees", [])
        
        print(f"[MOCK CALENDAR] Creating event '{title}' at {start_time} for {attendees}")
        
        return {
            "status": "success",
            "message": "Event created successfully",
            "data": {
                "event_id": "evt_mock_12345",
                "meeting_link": "https://meet.google.com/mock-abc-xyz",
                "start_time": start_time
            }
        }
    
    return {"status": "error", "message": f"Unknown action: {action}"}
