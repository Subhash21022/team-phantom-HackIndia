from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.database import models
from app.schemas import schemas

class CandidateRepository:
    async def get_candidates(self, db: AsyncSession, skip: int = 0, limit: int = 100):
        result = await db.execute(select(models.Candidate).offset(skip).limit(limit))
        return result.scalars().all()

    async def get_candidate(self, db: AsyncSession, candidate_id: int):
        result = await db.execute(select(models.Candidate).where(models.Candidate.id == candidate_id))
        return result.scalars().first()

    async def create_candidate(self, db: AsyncSession, candidate: schemas.CandidateCreate):
        db_candidate = models.Candidate(**candidate.model_dump())
        db.add(db_candidate)
        await db.commit()
        await db.refresh(db_candidate)
        return db_candidate

    async def update_candidate(self, db: AsyncSession, candidate_id: int, candidate_data: schemas.CandidateUpdate):
        db_candidate = await self.get_candidate(db, candidate_id)
        if db_candidate:
            update_data = candidate_data.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(db_candidate, key, value)
            await db.commit()
            await db.refresh(db_candidate)
        return db_candidate

    async def delete_candidate(self, db: AsyncSession, candidate_id: int):
        db_candidate = await self.get_candidate(db, candidate_id)
        if db_candidate:
            await db.delete(db_candidate)
            await db.commit()
        return db_candidate

candidate_repo = CandidateRepository()
