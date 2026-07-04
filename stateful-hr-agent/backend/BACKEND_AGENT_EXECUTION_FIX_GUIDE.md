# Backend Agent Execution Fix Guide

## Scope
This document explains **what failed**, **why it failed**, and **how to fix it** for backend execution reliability in the AI Stateful HR Agent.

It covers:
- LangGraph execution flow
- MCP action routing
- MCP servers (Postgres, Calendar, Gmail, Docs)
- External API and infrastructure dependencies
- Real end-to-end validation

## Current Failure Summary
From `backend/test_real_agent.py` run:

- Create Candidate: `FAIL`
- Update Candidate: `FAIL`
- Delete Candidate: `FAIL`
- Calendar: `FAIL`
- Docs: `FAIL`
- Gmail: `FAIL`
- Reason: `Database connection unavailable` (`ConnectionRefusedError`)

This means code-level routing/planning fixes are present, but runtime dependencies are not reachable.

## What Was Already Fixed in Code

### 1. Full request trace logging
Implemented in `backend/app/agent/nodes.py`:
- `[1] INPUT`
- `[2] INTENT`
- `[3] PLAN`
- `[4] MCP CALL`
- `[5] MCP RESULT`
- `[6] AG-UI GENERATED`

### 2. Planner action constraints + alias mapping
Implemented in `backend/app/agent/nodes.py` and `backend/app/agent/prompts.py`:
- Allowed tools/actions are constrained.
- Hallucinated actions like `update_record`, `modify_candidate`, `database_update` are mapped to canonical actions.

### 3. Strict MCP registry routing
Implemented in `backend/app/mcp/client.py` using `MCP_ACTIONS` registry.
- No string guessing.
- Unsupported tool/action now returns explicit error.

### 4. Entity resolution before update/delete
Implemented in `backend/app/agent/nodes.py`:
- Update/delete by name now resolves candidate first (`get_candidates`) and then uses `id`.

### 5. Multi-step context propagation
Implemented in `backend/app/agent/nodes.py`:
- Passes `candidate_id`, `candidate_email`, `candidate_name` across steps.

### 6. Postgres payload normalization
Implemented in `backend/app/mcp/servers/postgres_server.py`:
- `update_candidate` now supports both top-level fields and nested `data` payloads.

### 7. Canonical Calendar/Docs actions
Implemented in:
- `backend/app/mcp/servers/calendar_server.py` (`create_event`, `update_event`, `cancel_event`)
- `backend/app/mcp/servers/docs_server.py` (`create_document`, `update_document`)

## Why Tests Still Fail
Primary blocker is **infrastructure connectivity**, not planner/router logic:

1. Postgres/Supabase is unreachable from current runtime.
2. If DB is unreachable, CRUD cannot run.
3. Calendar/Gmail/Docs checks also fail later because workflow preconditions break and/or OAuth setup may be incomplete.

## How to Fix (Step-by-Step)

## Step 1: Fix Database Connectivity (Highest Priority)

### Verify environment variables
Check `backend/.env` or project `.env` includes valid values:
- `DATABASE_URL` (asyncpg URL format)
- Any Supabase host/user/password/dbname values used to construct it

Expected shape:
```env
DATABASE_URL=postgresql+asyncpg://USER:PASSWORD@HOST:5432/DBNAME?ssl=require
```

### Confirm network reachability to DB host
From machine/container running backend, verify host and port 5432 are reachable.

### If running with Docker
Ensure backend container can resolve and reach Supabase/Postgres endpoint.

### Validate DB manually
Run a simple SQLAlchemy or direct DB check before running agent tests:
- open connection
- run `SELECT 1`

If this fails, agent CRUD will always fail.

## Step 2: Ensure schema and tables exist
Run DB init/migrations:
- `python init_db.py`
- optional seed: `python seed.py`

Verify table exists and is writable:
- `candidates`

## Step 3: Validate OAuth for external tools
For Calendar/Gmail/Docs MCP servers:

Required files:
- `credentials.json`
- tokens generated after consent flow:
  - `token_calendar.json`
  - `token_gmail.json`
  - `token_docs.json`

If tokens are missing/invalid, first call will fail until OAuth consent completes.

## Step 4: Run backend API locally and inspect trace logs
Start backend and send command:
- `Change Rahul status to selected`

Expected logs pattern:
- `[1] INPUT` with user message
- `[2] INTENT` with normalized entities
- `[3] PLAN` with canonical tool/actions
- `[4] MCP CALL` showing `postgres_mcp.update_candidate()` payload with resolved `id`
- `[5] MCP RESULT` with success/error from DB
- `[6] AG-UI GENERATED` with output type

## Step 5: Execute real integration test
Run:
```bash
python backend/test_real_agent.py
```

Expected final output once infra is fixed:
- Create Candidate: `PASS`
- Update Candidate: `PASS`
- Delete Candidate: `PASS`
- Calendar: `PASS`
- Docs: `PASS`
- Gmail: `PASS`

## Deep-Dive Fixes by Failure Type

## A) Create Candidate fails
Common causes:
- DB unreachable
- invalid `DATABASE_URL`
- missing required candidate fields if parser cannot infer

Fix:
1. Restore DB connectivity.
2. Ensure create payload contains at least `name`, `email`, `role` (code now auto-fills defaults where possible).
3. Re-run test command:
   - `Create candidate Alex, Backend Engineer`

## B) Update Candidate fails
Common causes:
- candidate not found
- update called without resolved `id`
- payload shape mismatch

Fix:
1. Ensure Alex exists first.
2. Confirm trace shows name->id resolution step.
3. Confirm payload contains `id` and `data.status`.
4. Re-run:
   - `Change Alex status to selected`

## C) Delete Candidate fails
Common causes:
- no candidate resolved
- deletion by name attempted without `id`

Fix:
1. Ensure entity resolution maps Alex to candidate id.
2. Confirm trace shows `delete_candidate` payload with `id`.
3. Re-run:
   - `Delete Alex`

## D) Calendar fails
Common causes:
- OAuth credentials missing
- token expired/invalid
- invalid event payload (missing time)

Fix:
1. Ensure `credentials.json` exists.
2. Complete OAuth flow to generate `token_calendar.json`.
3. Ensure payload has `start_time` and valid attendees.

## E) Docs fails
Common causes:
- OAuth credentials missing
- missing doc permissions scope

Fix:
1. Ensure `token_docs.json` exists.
2. Verify `create_document` action is being called (canonical name).

## F) Gmail fails
Common causes:
- OAuth credentials missing
- missing recipient email (`to`)

Fix:
1. Ensure `token_gmail.json` exists.
2. Confirm context passing sets recipient from candidate lookup email.

## Operational Checklist
Use this checklist before declaring production-ready:

- [ ] DB reachable from backend runtime
- [ ] `SELECT 1` succeeds
- [ ] `candidates` table exists and CRUD works manually
- [ ] OAuth credentials and tokens exist for Calendar/Gmail/Docs
- [ ] LangGraph logs show steps [1]-[6] for each command
- [ ] Planner outputs only canonical actions
- [ ] MCP router rejects unsupported actions explicitly
- [ ] Real test script reports all PASS

## Recommended Command Order for Verification
1. `python backend/check_env.py`
2. `python backend/init_db.py`
3. `python backend/test_azure_supabase.py` (or equivalent DB connectivity check)
4. `python backend/test_google_apis.py`
5. `python backend/test_real_agent.py`

## Expected Final PASS Output
```text
Create Candidate: PASS
Update Candidate: PASS
Delete Candidate: PASS
Calendar: PASS
Docs: PASS
Gmail: PASS
```

## Notes
- Until DB connectivity is fixed, CRUD commands cannot pass regardless of planner/router correctness.
- External API tests (Calendar/Gmail/Docs) depend on OAuth setup and network access.
