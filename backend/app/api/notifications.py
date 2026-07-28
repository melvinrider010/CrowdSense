from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Notification
from app.core.auth import RoleChecker
from typing import List

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])

@router.get("/", dependencies=[Depends(RoleChecker(["Admin", "Operator", "Viewer"]))])
def get_notifications(db: Session = Depends(get_db)):
    notifications = db.query(Notification).filter(Notification.is_deleted == False).order_by(Notification.created_at.desc()).all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "is_read": n.is_read,
            "device_id": n.device_id,
            "event_id": n.event_id,
            "created_at": n.created_at
        }
        for n in notifications
    ]

@router.get("/unread-count", dependencies=[Depends(RoleChecker(["Admin", "Operator", "Viewer"]))])
def get_unread_count(db: Session = Depends(get_db)):
    count = db.query(Notification).filter(
        Notification.is_read == False, 
        Notification.is_deleted == False
    ).count()
    
    return {"unread_count": count}

@router.post("/{notification_id}/read", dependencies=[Depends(RoleChecker(["Admin", "Operator"]))])
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(
        Notification.id == notification_id, 
        Notification.is_deleted == False
    ).first()
    
    if not notif:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Notification not found"
        )
        
    notif.is_read = True
    db.commit()
    
    return {"message": "Notification marked as read successfully"}
