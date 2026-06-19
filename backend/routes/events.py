from fastapi import APIRouter, HTTPException, BackgroundTasks, Depends
from database import events_collection
from models.event import EventModel, UpdateEventModel
from bson import ObjectId
from datetime import datetime
from services.email import send_event_notification_email
from routes.auth import get_current_admin

router = APIRouter()

def calculate_days(start_str: str, end_str: str) -> int:
    try:
        start = datetime.strptime(start_str, "%Y-%m-%d")
        end = datetime.strptime(end_str, "%Y-%m-%d")
        days = (end - start).days + 1
        return days if days > 0 else 0
    except ValueError:
        return 0

@router.post("/events")
def create_event(event: EventModel, background_tasks: BackgroundTasks):
    event_dict = event.model_dump()
    event_dict["days"] = calculate_days(event_dict["startDate"], event_dict["endDate"])
    result = events_collection.insert_one(event_dict)
    
    # Queue email dispatch task in background
    background_tasks.add_task(send_event_notification_email, event_dict)
    
    return {
        "message": "Event Saved",
        "id": str(result.inserted_id)
    }

@router.get("/events")
def get_events(admin_user: str = Depends(get_current_admin)):
    events = []
    for event in events_collection.find():
        event["_id"] = str(event["_id"])
        events.append(event)
    return events

@router.put("/events/{event_id}")
def update_event(event_id: str, event_data: UpdateEventModel, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid Event ID")
        
    update_data = {k: v for k, v in event_data.model_dump().items() if v is not None}
    
    if "startDate" in update_data or "endDate" in update_data:
        # We need to recalculate days, meaning we might need the existing event data if one is missing
        existing = events_collection.find_one({"_id": ObjectId(event_id)})
        if existing:
            new_start = update_data.get("startDate", existing.get("startDate", ""))
            new_end = update_data.get("endDate", existing.get("endDate", ""))
            update_data["days"] = calculate_days(new_start, new_end)

    if len(update_data) == 0:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = events_collection.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return {"message": "Event updated successfully"}

@router.delete("/events/{event_id}")
def delete_event(event_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(event_id):
        raise HTTPException(status_code=400, detail="Invalid Event ID")
        
    result = events_collection.delete_one({"_id": ObjectId(event_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
        
    return {"message": "Event deleted successfully"}

@router.get("/events/employee/{employee_id}")
def get_employee_events(employee_id: str, admin_user: str = Depends(get_current_admin)):
    events = []
    for event in events_collection.find({"employeeId": employee_id}):
        event["_id"] = str(event["_id"])
        events.append(event)
    return events

