import asyncio
import time
from typing import Any, Dict, List

from dotenv import load_dotenv

load_dotenv()

from langchain_core.messages import HumanMessage
from sqlalchemy import text

from app.agent.graph import hr_agent_app
from app.database.database import AsyncSessionLocal


def _extract_results(state: Dict[str, Any]) -> List[Dict[str, Any]]:
    return state.get("mcp_results") or []


async def _invoke(message: str, thread_id: str) -> Dict[str, Any]:
    config = {"configurable": {"thread_id": thread_id}}
    inputs = {"messages": [HumanMessage(content=message)]}
    return await hr_agent_app.ainvoke(inputs, config)


async def _cleanup_alex() -> bool:
    try:
        async with AsyncSessionLocal() as db:
            await db.execute(text("DELETE FROM candidates WHERE LOWER(name) = LOWER(:name)"), {"name": "Alex"})
            await db.commit()
        return True
    except Exception:
        return False


async def _get_alex_row() -> Dict[str, Any] | None:
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            text("SELECT id, name, email, role, status FROM candidates WHERE LOWER(name) = LOWER(:name) ORDER BY id DESC LIMIT 1"),
            {"name": "Alex"},
        )
        row = res.fetchone()
        if not row:
            return None
        return {
            "id": row[0],
            "name": row[1],
            "email": row[2],
            "role": row[3],
            "status": row[4],
        }


async def _assert_calendar(thread_id: str) -> bool:
    state = await _invoke("Schedule Alex interview tomorrow at 10 AM and email him details", thread_id)
    results = _extract_results(state)
    return any(r.get("server") == "calendar_mcp" and (r.get("result") or {}).get("status") == "success" for r in results)


async def _assert_docs(thread_id: str) -> bool:
    state = await _invoke("Create offer letter document for Alex", thread_id)
    results = _extract_results(state)
    return any(r.get("server") == "docs_mcp" and (r.get("result") or {}).get("status") == "success" for r in results)


async def _assert_gmail(thread_id: str) -> bool:
    state = await _invoke("Send email to Alex about selection", thread_id)
    results = _extract_results(state)
    return any(r.get("server") == "gmail_mcp" and (r.get("result") or {}).get("status") == "success" for r in results)


async def main() -> None:
    thread_id = f"test-real-agent-{int(time.time())}"

    db_ready = await _cleanup_alex()
    if not db_ready:
        print("Create Candidate: FAIL")
        print("Update Candidate: FAIL")
        print("Delete Candidate: FAIL")
        print("Calendar: FAIL")
        print("Docs: FAIL")
        print("Gmail: FAIL")
        print("Reason: Database connection unavailable")
        return

    create_pass = False
    update_pass = False
    delete_pass = False
    calendar_pass = False
    docs_pass = False
    gmail_pass = False

    try:
        await _invoke("Create candidate Alex, Backend Engineer", thread_id)
        alex = await _get_alex_row()
        create_pass = bool(alex)

        await _invoke("Change Alex status to selected", thread_id)
        alex_updated = await _get_alex_row()
        update_pass = bool(alex_updated and str(alex_updated.get("status", "")).lower() == "selected")

        await _invoke("Delete Alex", thread_id)
        alex_deleted = await _get_alex_row()
        delete_pass = alex_deleted is None
    except Exception:
        pass

    try:
        calendar_pass = await _assert_calendar(thread_id)
    except Exception:
        calendar_pass = False

    try:
        docs_pass = await _assert_docs(thread_id)
    except Exception:
        docs_pass = False

    try:
        gmail_pass = await _assert_gmail(thread_id)
    except Exception:
        gmail_pass = False

    print(f"Create Candidate: {'PASS' if create_pass else 'FAIL'}")
    print(f"Update Candidate: {'PASS' if update_pass else 'FAIL'}")
    print(f"Delete Candidate: {'PASS' if delete_pass else 'FAIL'}")
    print(f"Calendar: {'PASS' if calendar_pass else 'FAIL'}")
    print(f"Docs: {'PASS' if docs_pass else 'FAIL'}")
    print(f"Gmail: {'PASS' if gmail_pass else 'FAIL'}")


if __name__ == "__main__":
    asyncio.run(main())
