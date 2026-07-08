from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid
import models, schemas
from database import get_db
from routers.auth import get_current_user

router = APIRouter(prefix="/invites", tags=["invites"])

@router.post("/", response_model=schemas.InviteResponse)
def create_invite(invite_data: schemas.InviteCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.email == invite_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User is already registered on the platform.")
        
    # Check if pending invite exists
    existing_invite = db.query(models.SystemInvite).filter(
        models.SystemInvite.email == invite_data.email,
        models.SystemInvite.status == "pending"
    ).first()
    if existing_invite:
        raise HTTPException(status_code=400, detail="An invite has already been sent to this email.")

    # Generate token
    token = str(uuid.uuid4())
    
    new_invite = models.SystemInvite(
        email=invite_data.email,
        token=token,
        invited_by_id=current_user.id
    )
    
    db.add(new_invite)
    db.commit()
    db.refresh(new_invite)
    
    # Simulate Email Sending
    print("\n" + "="*50)
    print(f"📧 SIMULATED EMAIL TO: {invite_data.email}")
    print(f"Subject: You have been invited to AI Research Workspace!")
    print(f"Link: http://localhost:5173/register?invite_token={token}")
    print("="*50 + "\n")
    
    return new_invite

@router.get("/accept/{token}", response_model=dict)
def accept_invite(token: str, db: Session = Depends(get_db)):
    invite = db.query(models.SystemInvite).filter(models.SystemInvite.token == token).first()
    if not invite or invite.status != "pending":
        raise HTTPException(status_code=404, detail="Invalid or expired invite token.")
        
    # In a full implementation, this might redirect to a register page.
    # For now, it just validates the token. The frontend will use this to allow registration.
    return {"email": invite.email, "message": "Token is valid. Proceed to register."}
