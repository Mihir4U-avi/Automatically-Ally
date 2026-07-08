from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List
import uuid
import os

from database import get_db
from models import ResearchPaper, ResearchProject, ProjectMember, User, RoleEnum
from schemas import PaperResponse, BulkDeletePapers
from routers.auth import get_current_user
import fitz  # PyMuPDF

router = APIRouter(
    prefix="/projects/{project_id}/papers",
    tags=["Papers"]
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

from fastapi.responses import FileResponse

def process_paper(paper_id: int, db: Session):
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id).first()
    if not paper:
        return
        
    try:
        paper.status = "scanning"
        db.commit()
        
        # Read PDF using PyMuPDF
        text_content = ""
        try:
            doc = fitz.open(paper.file_path)
            for page in doc:
                text_content += page.get_text()
            doc.close()
        except Exception as e:
            text_content = f"Failed to read PDF: {str(e)}"
            
        # Actual AI Summarization using Local Model
        try:
            import os
            from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
            
            model_path = "./ml_models/summarizer"
            if not os.path.exists(model_path):
                raise Exception("Local model not downloaded. Please run download_model.py")
                
            tokenizer = AutoTokenizer.from_pretrained(model_path)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_path)
            
            # Truncate text to avoid exceeding token limits (rough approximation of 1024 tokens)
            words = text_content.split()
            # Feed more words to get a better context for a larger summary
            input_text = " ".join(words[:900])
            
            inputs = tokenizer("summarize: " + input_text, return_tensors="pt", max_length=1024, truncation=True)
            # Increased max_length to 500 and min_length to 150 to generate much larger summaries
            outputs = model.generate(
                inputs["input_ids"], 
                max_length=500, 
                min_length=150, 
                length_penalty=2.0, 
                num_beams=4, 
                early_stopping=True
            )
            summary = tokenizer.decode(outputs[0], skip_special_tokens=True)
            
        except ImportError:
            summary = "Error: transformers library not installed."
        except Exception as e:
            summary = f"ML Error: {str(e)}\n\nFallback dummy summary: " + " ".join(text_content.split()[:200])
            
        paper.summary = summary
        paper.status = "completed"
        db.commit()
        
    except Exception as e:
        paper.status = "failed"
        paper.summary = f"Error processing file: {str(e)}"
        db.commit()

@router.get("/{paper_id}/download")
def download_paper(
    project_id: int,
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not (current_user.role == RoleEnum.admin or current_user.role == RoleEnum.supervisor):
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
            
    paper = db.query(ResearchPaper).filter(ResearchPaper.id == paper_id, ResearchPaper.project_id == project_id).first()
    if not paper or not os.path.exists(paper.file_path):
        raise HTTPException(status_code=404, detail="Paper not found")
        
    return FileResponse(paper.file_path, media_type='application/pdf', filename=paper.title)

@router.post("/upload", response_model=List[PaperResponse])
async def upload_papers(
    project_id: int,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify project access
    member = db.query(ProjectMember).filter(
        ProjectMember.project_id == project_id,
        ProjectMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")

    if len(files) > 30:
        raise HTTPException(status_code=400, detail="Maximum 30 files allowed per upload")

    uploaded_papers = []
    
    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            continue # Skip non-PDFs for now
            
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        with open(file_path, "wb") as f:
            content = await file.read()
            f.write(content)
            
        paper = ResearchPaper(
            title=file.filename,
            file_path=file_path,
            project_id=project_id,
            status="pending"
        )
        db.add(paper)
        db.commit()
        db.refresh(paper)
        uploaded_papers.append(paper)
        
        # Dispatch background task for each paper
        background_tasks.add_task(process_paper, paper.id, db)
        
    return uploaded_papers

@router.get("/", response_model=List[PaperResponse])
def get_papers(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not (current_user.role == RoleEnum.admin or current_user.role == RoleEnum.supervisor):
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
        
    papers = db.query(ResearchPaper).filter(ResearchPaper.project_id == project_id).all()
    return papers

@router.post("/bulk-delete", status_code=204)
def bulk_delete_papers(
    project_id: int,
    request: BulkDeletePapers,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify access
    if not (current_user.role == RoleEnum.admin or current_user.role == RoleEnum.supervisor):
        member = db.query(ProjectMember).filter(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == current_user.id
        ).first()
        if not member:
            raise HTTPException(status_code=403, detail="Not authorized to access this project")
            
    papers_to_delete = db.query(ResearchPaper).filter(
        ResearchPaper.project_id == project_id,
        ResearchPaper.id.in_(request.paper_ids)
    ).all()
    
    for paper in papers_to_delete:
        if os.path.exists(paper.file_path):
            try:
                os.remove(paper.file_path)
            except Exception:
                pass
        db.delete(paper)
        
    db.commit()
    return None
