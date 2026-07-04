from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.database import get_db
from app.database.repository import candidate_repo

router = APIRouter(prefix="/api/ui-schema", tags=["ui-schema"])


@router.get("/candidates")
async def candidates_ui_schema(db: AsyncSession = Depends(get_db)):
    """Return a UIConfig for the candidates table and a create form.
    The frontend's DynamicRenderer will render this config directly.
    """
    candidates = await candidate_repo.get_candidates(db, skip=0, limit=100)

    # Convert ORM objects to dicts (pydantic/config from_attributes in schema helps, but repo returns dict-like)
    data = [
        {
            "id": c.id,
            "name": c.name,
            "email": c.email,
            "role": c.role,
            "status": getattr(c, "status", None),
        }
        for c in candidates
    ]

    ui = {
        "type": "table",
        "title": "Candidates",
        "data": data,
        "actions": ["Create"],
        # provide a create form config that frontend can switch to when Create is clicked
        "create_form": {
            "type": "form",
            "title": "Create Candidate",
            "fields": [
                {"name": "name", "type": "text"},
                {"name": "email", "type": "email"},
                {"name": "role", "type": "text"},
                {"name": "phone", "type": "text"}
            ],
            "submit_action": "create_candidate"
        }
    }

    return ui
