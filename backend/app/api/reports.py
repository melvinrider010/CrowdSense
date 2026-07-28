import csv
import io
from datetime import datetime
from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.database.models import Event
from app.core.auth import RoleChecker
from typing import Optional

router = APIRouter(prefix="/api/reports", tags=["Reports"])

@router.get("/csv", dependencies=[Depends(RoleChecker(["Admin", "Operator"]))])
def export_csv(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Event).filter(Event.is_deleted == False)
    
    if start_date:
        try:
            # Handle standard date-only inputs from frontend (YYYY-MM-DD)
            if "T" not in start_date:
                start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            else:
                start_dt = datetime.fromisoformat(start_date)
            query = query.filter(Event.timestamp >= start_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid start_date format. Use YYYY-MM-DD or ISO format."
            )
            
    if end_date:
        try:
            if "T" not in end_date:
                # Make end of day inclusive
                end_dt = datetime.strptime(f"{end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
            else:
                end_dt = datetime.fromisoformat(end_date)
            query = query.filter(Event.timestamp <= end_dt)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Invalid end_date format. Use YYYY-MM-DD or ISO format."
            )
            
    if search:
        query = query.filter(
            (Event.device_id.ilike(f"%{search}%")) | 
            (Event.location.ilike(f"%{search}%")) | 
            (Event.status.ilike(f"%{search}%"))
        )
        
    events = query.order_by(Event.timestamp.desc()).all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Headers row
    writer.writerow(["ID", "Timestamp", "Device ID", "Location", "Status", "Distance (cm)"])
    
    for e in events:
        writer.writerow([
            e.id,
            e.timestamp.isoformat() if e.timestamp else "",
            e.device_id,
            e.location,
            e.status,
            e.distance
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=crowdsense_incidents_report.csv"}
    )
