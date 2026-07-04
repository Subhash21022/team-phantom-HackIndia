from typing import Dict, Any
from app.mcp.servers.postgres_server import execute_postgres
from app.mcp.servers.gmail_server import execute_gmail
from app.mcp.servers.calendar_server import execute_calendar
from app.mcp.servers.docs_server import execute_docs

class MCPClient:
    """
    Model Context Protocol (MCP) Client
    Provides a unified interface for the AI Agent to communicate with external systems.
    Currently routes to mock servers, making it easy to replace with real MCP servers later.
    """
    
    async def execute(self, server: str, action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes an action on a specific MCP server and returns a JSON serializable dict.
        """
        try:
            if server == "postgres":
                response = await execute_postgres(action, payload)
            elif server == "gmail":
                response = await execute_gmail(action, payload)
            elif server == "calendar":
                response = await execute_calendar(action, payload)
            elif server == "docs":
                response = await execute_docs(action, payload)
            else:
                return {"status": "error", "message": f"Unknown MCP server: {server}"}
            
            return response
            
        except Exception as e:
            return {"status": "error", "message": str(e)}

mcp_client = MCPClient()
