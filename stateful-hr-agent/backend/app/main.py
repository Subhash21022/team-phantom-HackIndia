from fastapi import FastAPI
from contextlib import asynccontextmanager
from app.database.database import engine, Base
from app.api.candidates import router as candidates_router
from fastapi.middleware.cors import CORSMiddleware

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
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(candidates_router)

@app.get("/")
def root():
    return {"status": "HR Agent API is up and running"}
