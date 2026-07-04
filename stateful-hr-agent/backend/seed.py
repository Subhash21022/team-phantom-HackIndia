import asyncio
import os
import sys

# Add backend directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.database import engine, AsyncSessionLocal, Base
from app.database import models

async def seed():
    print("Setting up the database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    print("Seeding candidates...")
    async with AsyncSessionLocal() as session:
        candidates = [
            models.Candidate(
                name="Alice Smith",
                email="alice@example.com",
                phone="555-0101",
                role="Frontend Developer",
                skills="React, Next.js, TypeScript",
                experience=4,
                status="applied"
            ),
            models.Candidate(
                name="Bob Johnson",
                email="bob@example.com",
                phone="555-0102",
                role="Backend Developer",
                skills="Python, FastAPI, PostgreSQL",
                experience=6,
                status="interviewing"
            ),
            models.Candidate(
                name="Charlie Brown",
                email="charlie@example.com",
                phone="555-0103",
                role="DevOps Engineer",
                skills="Docker, Kubernetes, AWS",
                experience=3,
                status="offered"
            )
        ]
        session.add_all(candidates)
        await session.commit()
        print("Database seeded with demo candidates successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
