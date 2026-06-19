from pydantic import BaseModel
from typing import Optional

class EmployeeModel(BaseModel):
    name: str
    employeeId: str
    email: Optional[str] = None
    department: Optional[str] = None

class UpdateEmployeeModel(BaseModel):
    name: Optional[str] = None
    employeeId: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
