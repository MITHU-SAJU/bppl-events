from fastapi import APIRouter, HTTPException, Depends
from database import invoices_collection
from models.invoice import InvoiceModel, UpdateInvoiceModel
from bson import ObjectId
from routes.auth import get_current_admin

router = APIRouter()

@router.post("/invoices")
def create_invoice(invoice: InvoiceModel, admin_user: str = Depends(get_current_admin)):
    # Check if invoiceNumber already exists
    if invoices_collection.find_one({"invoiceNumber": invoice.invoiceNumber}):
        raise HTTPException(status_code=400, detail="Invoice number already exists")
        
    inv_dict = invoice.model_dump()
    result = invoices_collection.insert_one(inv_dict)
    
    return {
        "message": "Invoice created successfully",
        "id": str(result.inserted_id)
    }

@router.get("/invoices")
def get_invoices(admin_user: str = Depends(get_current_admin)):
    invoices = []
    for inv in invoices_collection.find():
        inv["_id"] = str(inv["_id"])
        invoices.append(inv)
    return invoices

@router.get("/invoices/{inv_id}")
def get_invoice(inv_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(inv_id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
    
    inv = invoices_collection.find_one({"_id": ObjectId(inv_id)})
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    inv["_id"] = str(inv["_id"])
    return inv

@router.put("/invoices/{inv_id}")
def update_invoice(inv_id: str, inv_data: UpdateInvoiceModel, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(inv_id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
        
    update_data = {k: v for k, v in inv_data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    result = invoices_collection.update_one(
        {"_id": ObjectId(inv_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return {"message": "Invoice updated successfully"}

@router.delete("/invoices/{inv_id}")
def delete_invoice(inv_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(inv_id):
        raise HTTPException(status_code=400, detail="Invalid Invoice ID format")
        
    result = invoices_collection.delete_one({"_id": ObjectId(inv_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    return {"message": "Invoice deleted successfully"}
