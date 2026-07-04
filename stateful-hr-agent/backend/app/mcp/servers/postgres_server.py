from typing import Any, Dict

from app.database.database import AsyncSessionLocal
from app.database.repository import candidate_repo
from app.schemas import schemas


async def execute_postgres(action: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Postgres MCP server for candidate operations.
    """
    async with AsyncSessionLocal() as db:
        if action == "create_candidate":
            create_payload = dict(payload or {})
            if create_payload.get("name") and not create_payload.get("email"):
                safe_name = "".join(ch.lower() if ch.isalnum() else "." for ch in str(create_payload["name"]))
                while ".." in safe_name:
                    safe_name = safe_name.replace("..", ".")
                create_payload["email"] = f"{safe_name.strip('.')}@example.com"
            create_payload.setdefault("role", "Generalist")
            create_payload.setdefault("status", "applied")

            candidate_data = schemas.CandidateCreate(**create_payload)
            db_candidate = await candidate_repo.create_candidate(db, candidate_data)
            return {
                "status": "success",
                "data": {
                    "id": db_candidate.id,
                    "name": db_candidate.name,
                    "email": db_candidate.email,
                    "status": db_candidate.status,
                },
            }

        if action == "get_candidates":
            skip = payload.get("skip", 0)
            limit = payload.get("limit", 200)
            name_filter = (payload.get("name") or "").strip().lower()

            candidates = await candidate_repo.get_candidates(db, skip, limit)
            result = [
                {
                    "id": c.id,
                    "name": c.name,
                    "email": c.email,
                    "phone": c.phone,
                    "role": c.role,
                    "experience": c.experience,
                    "status": c.status,
                }
                for c in candidates
            ]
            if name_filter:
                result = [row for row in result if name_filter in str(row.get("name", "")).lower()]
            return {"status": "success", "data": result}

        if action == "update_candidate":
            candidate_id = payload.get("id")
            if not candidate_id:
                return {"status": "error", "message": "candidate id required"}

            known_fields = {"name", "email", "phone", "role", "skills", "experience", "status", "resume_url"}
            update_raw = payload.get("data") if isinstance(payload.get("data"), dict) else {
                k: v for k, v in payload.items() if k in known_fields
            }
            update_data = schemas.CandidateUpdate(**(update_raw or {}))

            db_candidate = await candidate_repo.update_candidate(db, candidate_id, update_data)
            if db_candidate:
                return {
                    "status": "success",
                    "data": {
                        "id": db_candidate.id,
                        "name": db_candidate.name,
                        "email": db_candidate.email,
                        "status": db_candidate.status,
                    },
                }
            return {"status": "error", "message": "candidate not found"}

        if action == "delete_candidate":
            candidate_id = payload.get("id")
            if not candidate_id:
                return {"status": "error", "message": "candidate id required"}
            db_candidate = await candidate_repo.delete_candidate(db, candidate_id)
            if db_candidate:
                return {"status": "success", "message": "Candidate deleted"}
            return {"status": "error", "message": "candidate not found"}

        return {"status": "error", "message": f"Unknown action: {action}"}
