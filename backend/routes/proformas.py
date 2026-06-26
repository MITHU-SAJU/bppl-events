from fastapi import APIRouter, HTTPException, Depends
from database import proformas_collection
from models.proforma import ProformaModel, UpdateProformaModel
from bson import ObjectId
from routes.auth import get_current_admin

router = APIRouter()

@router.post("/proformas")
def create_proforma(proforma: ProformaModel, admin_user: str = Depends(get_current_admin)):
    if proformas_collection.find_one({"invoiceNumber": proforma.invoiceNumber}):
        raise HTTPException(status_code=400, detail="Proforma invoice number already exists")
        
    prof_dict = proforma.model_dump()
    result = proformas_collection.insert_one(prof_dict)
    
    return {
        "message": "Proforma invoice created successfully",
        "id": str(result.inserted_id)
    }

@router.get("/proformas")
def get_proformas(admin_user: str = Depends(get_current_admin)):
    proformas = []
    for prof in proformas_collection.find():
        prof["_id"] = str(prof["_id"])
        proformas.append(prof)
    return proformas

@router.get("/proformas/{prof_id}")
def get_proforma(prof_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(prof_id):
        raise HTTPException(status_code=400, detail="Invalid Proforma ID format")
    
    prof = proformas_collection.find_one({"_id": ObjectId(prof_id)})
    if not prof:
        raise HTTPException(status_code=404, detail="Proforma invoice not found")
        
    prof["_id"] = str(prof["_id"])
    return prof

@router.put("/proformas/{prof_id}")
def update_proforma(prof_id: str, prof_data: UpdateProformaModel, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(prof_id):
        raise HTTPException(status_code=400, detail="Invalid Proforma ID format")
        
    update_data = {k: v for k, v in prof_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = proformas_collection.update_one(
        {"_id": ObjectId(prof_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Proforma invoice not found")
        
    return {"message": "Proforma invoice updated successfully"}

@router.delete("/proformas/{prof_id}")
def delete_proforma(prof_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(prof_id):
        raise HTTPException(status_code=400, detail="Invalid Proforma ID format")
        
    result = proformas_collection.delete_one({"_id": ObjectId(prof_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Proforma invoice not found")
        
    return {"message": "Proforma invoice deleted successfully"}
