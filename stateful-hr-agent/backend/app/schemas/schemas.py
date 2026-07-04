from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class CandidateBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str
    skills: Optional[str] = None
    experience: Optional[int] = 0
    status: Optional[str] = "applied"
    resume_url: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[int] = None
    status: Optional[str] = None
    resume_url: Optional[str] = None

class CandidateOut(CandidateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
