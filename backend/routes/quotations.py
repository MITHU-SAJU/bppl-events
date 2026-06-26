from fastapi import APIRouter, HTTPException, Depends
from database import quotations_collection
from models.quotation import QuotationModel, UpdateQuotationModel
from bson import ObjectId
from routes.auth import get_current_admin

router = APIRouter()

@router.post("/quotations")
def create_quotation(quotation: QuotationModel, admin_user: str = Depends(get_current_admin)):
    if quotations_collection.find_one({"invoiceNumber": quotation.invoiceNumber}):
        raise HTTPException(status_code=400, detail="Quotation number already exists")
        
    quot_dict = quotation.model_dump()
    result = quotations_collection.insert_one(quot_dict)
    
    return {
        "message": "Quotation created successfully",
        "id": str(result.inserted_id)
    }

@router.get("/quotations")
def get_quotations(admin_user: str = Depends(get_current_admin)):
    quotations = []
    for quot in quotations_collection.find():
        quot["_id"] = str(quot["_id"])
        quotations.append(quot)
    return quotations

@router.get("/quotations/{quot_id}")
def get_quotation(quot_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(quot_id):
        raise HTTPException(status_code=400, detail="Invalid Quotation ID format")
    
    quot = quotations_collection.find_one({"_id": ObjectId(quot_id)})
    if not quot:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    quot["_id"] = str(quot["_id"])
    return quot

@router.put("/quotations/{quot_id}")
def update_quotation(quot_id: str, quot_data: UpdateQuotationModel, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(quot_id):
        raise HTTPException(status_code=400, detail="Invalid Quotation ID format")
        
    update_data = {k: v for k, v in quot_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = quotations_collection.update_one(
        {"_id": ObjectId(quot_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    return {"message": "Quotation updated successfully"}

@router.delete("/quotations/{quot_id}")
def delete_quotation(quot_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(quot_id):
        raise HTTPException(status_code=400, detail="Invalid Quotation ID format")
        
    result = quotations_collection.delete_one({"_id": ObjectId(quot_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quotation not found")
        
    return {"message": "Quotation deleted successfully"}
