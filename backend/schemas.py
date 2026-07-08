from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from models import RoleEnum, ResearchTaskStatus

# --- User Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    role: RoleEnum
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Project Schemas ---
class ProjectCreate(BaseModel):
    title: str
    topic: Optional[str] = None
    description: Optional[str] = None

class ProjectResponse(BaseModel):
    id: int
    title: str
    topic: Optional[str] = None
    description: Optional[str] = None
    completion_percentage: int
    paper_count: int = 0
    task_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    topic: Optional[str] = None
    description: Optional[str] = None
    completion_percentage: Optional[int] = None

# --- Paper Schemas ---
class PaperResponse(BaseModel):
    id: int
    title: str
    file_path: str
    status: str
    summary: Optional[str] = None
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BulkDeletePapers(BaseModel):
    paper_ids: List[int]

# --- Task Schemas ---
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Optional[ResearchTaskStatus] = ResearchTaskStatus.todo

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[ResearchTaskStatus] = None

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    status: ResearchTaskStatus
    project_id: int
    assignee_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Admin Request Schemas ---
class AdminRequestResponse(BaseModel):
    id: int
    requester_id: int
    requester: UserResponse
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Invite Schemas ---
class InviteCreate(BaseModel):
    email: EmailStr

class InviteResponse(BaseModel):
    id: int
    email: str
    token: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True
