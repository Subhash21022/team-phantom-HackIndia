from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.database.database import get_db
from app.database.repository import candidate_repo
from app.schemas import schemas

router = APIRouter(prefix="/api/candidates", tags=["candidates"])

@router.get("/", response_model=List[schemas.CandidateOut])
async def get_candidates(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await candidate_repo.get_candidates(db, skip=skip, limit=limit)

@router.post("/", response_model=schemas.CandidateOut)
async def create_candidate(candidate: schemas.CandidateCreate, db: AsyncSession = Depends(get_db)):
    return await candidate_repo.create_candidate(db, candidate)

@router.patch("/{candidate_id}", response_model=schemas.CandidateOut)
async def update_candidate(candidate_id: int, candidate: schemas.CandidateUpdate, db: AsyncSession = Depends(get_db)):
    db_candidate = await candidate_repo.update_candidate(db, candidate_id, candidate)
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return db_candidate

@router.delete("/{candidate_id}")
async def delete_candidate(candidate_id: int, db: AsyncSession = Depends(get_db)):
    db_candidate = await candidate_repo.delete_candidate(db, candidate_id)
    if not db_candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return {"message": "Candidate deleted successfully"}
