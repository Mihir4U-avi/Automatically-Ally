from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

@router.post("/", response_model=schemas.ProjectResponse)
def create_project(project: schemas.ProjectCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db_project = models.ResearchProject(
        title=project.title,
        topic=project.topic,
        description=project.description
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)

    # Add user as a member
    member = models.ProjectMember(user_id=current_user.id, project_id=db_project.id)
    db.add(member)
    db.commit()
    
    return db_project

@router.get("/", response_model=List[schemas.ProjectResponse])
def get_user_projects(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == models.RoleEnum.admin or current_user.role == models.RoleEnum.supervisor:
        return db.query(models.ResearchProject).all()
        
    # Get all projects where the user is a member
    projects = db.query(models.ResearchProject).join(models.ProjectMember).filter(models.ProjectMember.user_id == current_user.id).all()
    return projects

@router.get("/{project_id}", response_model=schemas.ProjectResponse)
def get_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == models.RoleEnum.admin or current_user.role == models.RoleEnum.supervisor:
        project = db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).first()
    else:
        project = db.query(models.ResearchProject).join(models.ProjectMember).filter(
            models.ProjectMember.user_id == current_user.id,
            models.ResearchProject.id == project_id
        ).first()
        
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    return project

@router.get("/{project_id}/members", response_model=List[schemas.UserResponse])
def get_project_members(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify access
    if current_user.role != models.RoleEnum.admin and current_user.role != models.RoleEnum.supervisor:
        member = db.query(models.ProjectMember).filter(
            models.ProjectMember.user_id == current_user.id,
            models.ProjectMember.project_id == project_id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Not authorized to view members of this project")
            
    members = db.query(models.User).join(models.ProjectMember).filter(models.ProjectMember.project_id == project_id).all()
    return members

@router.put("/{project_id}", response_model=schemas.ProjectResponse)
def update_project(project_id: int, project_update: schemas.ProjectUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    project = db.query(models.ResearchProject).join(models.ProjectMember).filter(
        models.ProjectMember.user_id == current_user.id,
        models.ResearchProject.id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
    
    update_data = project_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
        
    db.commit()
    db.refresh(project)
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Verify access
    project = db.query(models.ResearchProject).join(models.ProjectMember).filter(
        models.ProjectMember.user_id == current_user.id,
        models.ResearchProject.id == project_id
    ).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or access denied")
        
    # Delete related members, tasks, papers first (or cascade)
    db.query(models.ProjectMember).filter(models.ProjectMember.project_id == project_id).delete()
    db.query(models.ResearchTask).filter(models.ResearchTask.project_id == project_id).delete()
    db.query(models.ResearchPaper).filter(models.ResearchPaper.project_id == project_id).delete()
    db.query(models.ResearchProject).filter(models.ResearchProject.id == project_id).delete()
    db.commit()
    return None
