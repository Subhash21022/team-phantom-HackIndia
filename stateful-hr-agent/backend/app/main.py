import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from the project root (one level above /backend)
_env_path = Path(__file__).resolve().parents[2] / ".env"
load_dotenv(dotenv_path=_env_path, override=True)

from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database.database import engine, Base
from app.api.candidates import router as candidates_router
from app.api.chat import router as chat_router
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Setup database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield

app = FastAPI(title="Stateful AI HR Agent Platform API", lifespan=lifespan)

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    # During local development allow all origins to simplify testing across
    # localhost and LAN addresses. In production, restrict this to trusted
    # frontend origins and enable credentials as required.
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candidates_router)
app.include_router(chat_router)
from app.api.ui_schema import router as ui_schema_router
app.include_router(ui_schema_router)

@app.get("/health")
async def health_check():
    # Ping DB
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "failed"
        
    azure_status = "connected" if os.getenv("AZURE_OPENAI_API_KEY") else "missing key"
    google_status = "ready" if os.path.exists("credentials.json") else "missing credentials.json"
    
    return {
        "database": db_status,
        "azure": azure_status,
        "google": google_status
    }

@app.get("/")
def root():
    return {"status": "HR Agent API is up and running"}
