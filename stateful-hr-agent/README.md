# Stateful AI HR Agent Platform

A stateful AI HR Agent Platform built with Next.js 15, FastAPI, LangGraph, and PostgreSQL.

## Architecture

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui (AG-UI)
- **Backend:** Python FastAPI
- **Agent:** LangGraph
- **Database:** PostgreSQL + SQLAlchemy
- **AI:** OpenAI API

## Setup Instructions

1. **Database:**
   ```bash
   cp .env.example .env
   docker-compose up -d
   ```

2. **Backend:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   pip install -r requirements.txt
   ```

3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
