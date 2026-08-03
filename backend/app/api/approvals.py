from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.approval import ApprovalResponse
from app.models.approval import Approval

router = APIRouter()

@router.get("/approvals", response_model=list[ApprovalResponse])
def get_approvals(db: Session = Depends(get_db)):
    return db.query(Approval).order_by(Approval.timestamp.desc()).all()
