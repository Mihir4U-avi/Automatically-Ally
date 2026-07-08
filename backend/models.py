from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum
from datetime import datetime

class RoleEnum(str, enum.Enum):
    admin = "Admin"
    student = "Student"
    researcher = "Researcher"
    supervisor = "Supervisor"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    role = Column(Enum(RoleEnum), default=RoleEnum.researcher)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = relationship("ProjectMember", back_populates="user")
    tasks = relationship("ResearchTask", back_populates="assignee")

class ResearchProject(Base):
    __tablename__ = "research_projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    topic = Column(String)
    objective = Column(Text)
    description = Column(Text)
    research_questions = Column(Text) # JSON string or text
    keywords = Column(String)
    completion_percentage = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    members = relationship("ProjectMember", back_populates="project")
    papers = relationship("ResearchPaper", back_populates="project")
    tasks = relationship("ResearchTask", back_populates="project")
    
    @property
    def paper_count(self) -> int:
        return len(self.papers) if self.papers else 0
        
    @property
    def task_count(self) -> int:
        return len(self.tasks) if self.tasks else 0

class ProjectMember(Base):
    __tablename__ = "project_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    
    user = relationship("User", back_populates="projects")
    project = relationship("ResearchProject", back_populates="members")

class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    authors = Column(String)
    abstract = Column(Text)
    file_path = Column(String) # Path to uploaded PDF
    status = Column(String, default="pending") # pending, scanning, completed, failed
    summary = Column(Text, nullable=True)
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ResearchProject", back_populates="papers")

class ResearchTaskStatus(str, enum.Enum):
    todo = "To Do"
    reading = "Reading"
    reviewing = "Reviewing"
    experiment = "Experiment"
    writing = "Writing"
    completed = "Completed"

class ResearchTask(Base):
    __tablename__ = "research_tasks"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    status = Column(Enum(ResearchTaskStatus), default=ResearchTaskStatus.todo)
    project_id = Column(Integer, ForeignKey("research_projects.id"))
    assignee_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("ResearchProject", back_populates="tasks")
    assignee = relationship("User", back_populates="tasks")

class AdminTransferRequest(Base):
    __tablename__ = "admin_requests"

    id = Column(Integer, primary_key=True, index=True)
    requester_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending") # pending, approved, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

    requester = relationship("User")

class SystemInvite(Base):
    __tablename__ = "system_invites"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True, nullable=False)
    token = Column(String, unique=True, index=True, nullable=False)
    status = Column(String, default="pending") # pending, accepted
    invited_by_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    inviter = relationship("User")
