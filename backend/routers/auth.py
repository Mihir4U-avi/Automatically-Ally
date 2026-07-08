from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import models, schemas, auth_utils
from database import get_db
from jose import JWTError, jwt

router = APIRouter(prefix="/auth", tags=["auth"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth_utils.SECRET_KEY, algorithms=[auth_utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth_utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth_utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth_utils.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth_utils.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/password", response_model=schemas.UserResponse)
def change_password(
    password_data: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not auth_utils.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect current password"
        )
    
    current_user.hashed_password = auth_utils.get_password_hash(password_data.new_password)
    db.commit()
    db.refresh(current_user)
    return current_user

# --- Admin Request Logic ---

@router.post("/request-admin", response_model=dict)
def request_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role == models.RoleEnum.admin:
        raise HTTPException(status_code=400, detail="You are already an Admin")
        
    # Check if any admin exists
    admin_exists = db.query(models.User).filter(models.User.role == models.RoleEnum.admin).first()
    
    if not admin_exists:
        # Instantly promote
        current_user.role = models.RoleEnum.admin
        db.commit()
        return {"message": "You have been promoted to Admin instantly."}
        
    # Create request
    existing_req = db.query(models.AdminTransferRequest).filter(
        models.AdminTransferRequest.requester_id == current_user.id,
        models.AdminTransferRequest.status == "pending"
    ).first()
    if existing_req:
        raise HTTPException(status_code=400, detail="You already have a pending admin request.")
        
    req = models.AdminTransferRequest(requester_id=current_user.id)
    db.add(req)
    db.commit()
    return {"message": "Admin request submitted successfully."}

@router.get("/admin-requests", response_model=list[schemas.AdminRequestResponse])
def get_admin_requests(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admins can view requests.")
    
    return db.query(models.AdminTransferRequest).filter(models.AdminTransferRequest.status == "pending").all()

@router.put("/approve-admin/{request_id}", response_model=dict)
def approve_admin_request(request_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != models.RoleEnum.admin:
        raise HTTPException(status_code=403, detail="Only admins can approve requests.")
        
    req = db.query(models.AdminTransferRequest).filter(models.AdminTransferRequest.id == request_id).first()
    if not req or req.status != "pending":
        raise HTTPException(status_code=404, detail="Pending request not found.")
        
    # Approve request
    req.status = "approved"
    
    # Swap roles
    requester = db.query(models.User).filter(models.User.id == req.requester_id).first()
    requester.role = models.RoleEnum.admin
    current_user.role = models.RoleEnum.researcher
    
    # Reject all other pending requests
    other_reqs = db.query(models.AdminTransferRequest).filter(
        models.AdminTransferRequest.status == "pending",
        models.AdminTransferRequest.id != request_id
    ).all()
    for other in other_reqs:
        other.status = "rejected"
        
    db.commit()
    return {"message": "Role swapped successfully. You are now a Researcher."}
