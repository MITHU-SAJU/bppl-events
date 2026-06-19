from fastapi import APIRouter, HTTPException, Depends
from database import employees_collection
from models.employee import EmployeeModel, UpdateEmployeeModel
from bson import ObjectId
from routes.auth import get_current_admin

router = APIRouter()

@router.post("/employees")
def create_employee(employee: EmployeeModel, admin_user: str = Depends(get_current_admin)):
    # Check if employee ID already exists
    if employees_collection.find_one({"employeeId": employee.employeeId}):
        raise HTTPException(status_code=400, detail="Employee ID already exists")
        
    emp_dict = employee.model_dump()
    result = employees_collection.insert_one(emp_dict)
    
    return {
        "message": "Employee created successfully",
        "id": str(result.inserted_id)
    }

@router.get("/employees")
def get_employees():
    employees = []
    for emp in employees_collection.find():
        emp["_id"] = str(emp["_id"])
        employees.append(emp)
    return employees

@router.put("/employees/{emp_id}")
def update_employee(emp_id: str, emp_data: UpdateEmployeeModel, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(emp_id):
        raise HTTPException(status_code=400, detail="Invalid Employee ID format")
        
    update_data = {k: v for k, v in emp_data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = employees_collection.update_one(
        {"_id": ObjectId(emp_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return {"message": "Employee updated successfully"}

@router.delete("/employees/{emp_id}")
def delete_employee(emp_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(emp_id):
        raise HTTPException(status_code=400, detail="Invalid Employee ID format")
        
    result = employees_collection.delete_one({"_id": ObjectId(emp_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Employee not found")
        
    return {"message": "Employee deleted successfully"}
