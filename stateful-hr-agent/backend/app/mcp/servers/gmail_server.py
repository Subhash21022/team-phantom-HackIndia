from typing import Dict, Any

async def execute_gmail(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mock Gmail MCP Server
    Will be replaced by a real Gmail MCP integration later.
    """
    if action == "send_email":
        to_email = payload.get("to")
        subject = payload.get("subject")
        body = payload.get("body")
        
        # In a real MCP, this would call the external API via proper HTTP/RPC
        print(f"[MOCK GMAIL] Sending email to {to_email} | Subject: {subject}")
        
        return {
            "status": "success",
            "message": "Email sent successfully",
            "data": {
                "to": to_email,
                "timestamp": "2026-07-04T12:00:00Z" # Mock timestamp
            }
        }
    
    return {"status": "error", "message": f"Unknown action: {action}"}
