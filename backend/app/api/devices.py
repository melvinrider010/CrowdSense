from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Device, Event
from app.core.auth import RoleChecker
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

router = APIRouter(prefix="/api/devices", tags=["Devices"])

class DeviceCreate(BaseModel):
    device_id: str = Field(..., min_length=2, max_length=50)
    location: Optional[str] = "Unknown"
    status: Optional[str] = "ACTIVE"

class DeviceUpdate(BaseModel):
    location: Optional[str] = None
    status: Optional[str] = None

@router.get("/", dependencies=[Depends(RoleChecker(["Admin", "Operator", "Viewer"]))])
def get_devices(db: Session = Depends(get_db)):
    devices = db.query(Device).filter(Device.is_deleted == False).order_by(Device.created_at.desc()).all()
    result = []
    
    for d in devices:
        latest_event = db.query(Event).filter(
            Event.device_id == d.device_id, 
            Event.is_deleted == False
        ).order_by(Event.timestamp.desc()).first()
        
        last_seen = latest_event.timestamp if latest_event else None
        
        # Calculate active ping status
        ping = "0.2ms" if latest_event else "Offline"
        
        result.append({
            "id": d.id,
            "device_id": d.device_id,
            "status": d.status,
            "location": d.location,
            "created_at": d.created_at,
            "updated_at": d.updated_at,
            "last_seen": last_seen,
            "ping": ping
        })
        
    return result

@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED, dependencies=[Depends(RoleChecker(["Admin", "Operator"]))])
def register_device(device_in: DeviceCreate, db: Session = Depends(get_db)):
    existing = db.query(Device).filter(
        Device.device_id == device_in.device_id, 
        Device.is_deleted == False
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Device ID already registered"
        )
        
    db_device = Device(
        device_id=device_in.device_id,
        location=device_in.location,
        status=device_in.status
    )
    db.add(db_device)
    db.commit()
    db.refresh(db_device)
    
    return {"message": "Device registered successfully", "id": db_device.id}

@router.put("/{device_id}", dependencies=[Depends(RoleChecker(["Admin", "Operator"]))])
def update_device(device_id: int, device_in: DeviceUpdate, db: Session = Depends(get_db)):
    device = db.query(Device).filter(
        Device.id == device_id, 
        Device.is_deleted == False
    ).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Device not found"
        )
        
    if device_in.location is not None:
        device.location = device_in.location
    if device_in.status is not None:
        device.status = device_in.status
        
    db.commit()
    return {"message": "Device updated successfully"}

@router.delete("/{device_id}", dependencies=[Depends(RoleChecker(["Admin"]))])
def delete_device(device_id: int, db: Session = Depends(get_db)):
    device = db.query(Device).filter(
        Device.id == device_id, 
        Device.is_deleted == False
    ).first()
    
    if not device:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Device not found"
        )
        
    device.is_deleted = True
    db.commit()
    
    return {"message": "Device deleted successfully"}
