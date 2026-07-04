# Stateful AI HR Agent Platform

A stateful AI HR Agent Platform built with Next.js 15, FastAPI, LangGraph, and PostgreSQL.

## Architecture

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui (AG-UI)
- **Backend:** Python FastAPI
- **Agent:** LangGraph
- **Database:** PostgreSQL + SQLAlchemy
- **AI:** OpenAI API

## Setup Instructions

1. **Environment:**
   ```bash
   cp .env.example .env
   ```

   Set `DATABASE_URL` to an available PostgreSQL instance. The app now expects the database to be provided by your local environment or hosted service.

2. **Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\\Scripts\\activate`
   pip install -r requirements.txt
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Run the backend:**
   ```bash
   cd backend
   .\\venv\\Scripts\\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

## Run With Docker

1. From `stateful-hr-agent`, copy env template:
   ```bash
   cp .env.docker.example .env
   ```

2. Build and run all services:
   ```bash
   docker compose up --build
   ```

3. Open:
   - Frontend: `http://localhost:3000`
   - Backend: `http://localhost:8000`

### Services
- `db` (PostgreSQL 16)
- `backend` (FastAPI on 8000)
- `frontend` (Next.js dev server on 3000)

### Stop
```bash
docker compose down
```

### Stop and remove DB volume
```bash
docker compose down -v
```
