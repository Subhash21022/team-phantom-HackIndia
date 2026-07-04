from typing import Dict, Any

async def execute_docs(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Mock Docs MCP Server
    Will be replaced by a real Google Docs/Notion MCP integration later.
    """
    if action == "generate_document":
        doc_type = payload.get("type", "offer_letter")
        candidate_name = payload.get("candidate_name", "Unknown")
        
        print(f"[MOCK DOCS] Generating {doc_type} for {candidate_name}")
        
        return {
            "status": "success",
            "message": "Document generated successfully",
            "data": {
                "document_id": "doc_mock_98765",
                "document_url": f"https://docs.mock.com/{doc_type}_{candidate_name.replace(' ', '_')}.pdf",
                "type": doc_type
            }
        }
    
    return {"status": "error", "message": f"Unknown action: {action}"}
