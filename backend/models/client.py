from pydantic import BaseModel
from typing import Optional

class ClientModel(BaseModel):
    clientName: str
    companyName: Optional[str] = ""
    mobileNumber: str
    email: Optional[str] = ""
    gstNumber: Optional[str] = ""
    address: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    pincode: Optional[str] = ""
    notes: Optional[str] = ""

class UpdateClientModel(BaseModel):
    clientName: Optional[str] = None
    companyName: Optional[str] = None
    mobileNumber: Optional[str] = None
    email: Optional[str] = None
    gstNumber: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    notes: Optional[str] = None
