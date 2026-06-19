from pydantic import BaseModel
from typing import Optional

class EventModel(BaseModel):
    employeeId: str
    employeeName: str
    startDate: str
    endDate: str
    eventName: str
    eventPlace: str
    particulars: Optional[str] = ""

class UpdateEventModel(BaseModel):
    employeeId: Optional[str] = None
    employeeName: Optional[str] = None
    startDate: Optional[str] = None
    endDate: Optional[str] = None
    eventName: Optional[str] = None
    eventPlace: Optional[str] = None
    particulars: Optional[str] = None
