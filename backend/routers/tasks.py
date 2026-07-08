from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/projects/{project_id}/tasks", tags=["tasks"])

def verify_project_access(db: Session, project_id: int, user: models.User, read_only: bool = False):
    if read_only and (user.role == models.RoleEnum.admin or user.role == models.RoleEnum.supervisor):
        return True
        
    member = db.query(models.ProjectMember).filter(
        models.ProjectMember.project_id == project_id,
        models.ProjectMember.user_id == user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to access tasks for this project")
    return True

@router.get("/", response_model=List[schemas.TaskResponse])
def get_tasks(project_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    verify_project_access(db, project_id, current_user, read_only=True)
    return db.query(models.ResearchTask).filter(models.ResearchTask.project_id == project_id).all()

@router.post("/", response_model=schemas.TaskResponse)
def create_task(project_id: int, task: schemas.TaskCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    verify_project_access(db, project_id, current_user)
    db_task = models.ResearchTask(
        title=task.title,
        description=task.description,
        status=task.status,
        project_id=project_id,
        assignee_id=current_user.id
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

@router.put("/{task_id}", response_model=schemas.TaskResponse)
def update_task(project_id: int, task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    verify_project_access(db, project_id, current_user)
    db_task = db.query(models.ResearchTask).filter(
        models.ResearchTask.id == task_id,
        models.ResearchTask.project_id == project_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    update_data = task_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_task, key, value)
        
    db.commit()
    db.refresh(db_task)
    return db_task

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(project_id: int, task_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    verify_project_access(db, project_id, current_user)
    db_task = db.query(models.ResearchTask).filter(
        models.ResearchTask.id == task_id,
        models.ResearchTask.project_id == project_id
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
        
    db.delete(db_task)
    db.commit()
    return None
