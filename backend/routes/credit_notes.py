from fastapi import APIRouter, HTTPException, Depends
from database import credit_notes_collection, invoices_collection
from models.credit_note import CreditNoteModel, UpdateCreditNoteModel
from bson import ObjectId
from routes.auth import get_current_admin

router = APIRouter()

@router.post("/credit-notes")
def create_credit_note(note: CreditNoteModel, admin_user: str = Depends(get_current_admin)):
    # 1. Check if Credit Note number already exists
    if credit_notes_collection.find_one({"invoiceNumber": note.invoiceNumber}):
        raise HTTPException(status_code=400, detail="Credit Note number already exists")
        
    # 2. Check if parent invoice exists
    if not ObjectId.is_valid(note.invoiceId):
        raise HTTPException(status_code=400, detail="Invalid parent Invoice ID format")
    parent_invoice = invoices_collection.find_one({"_id": ObjectId(note.invoiceId)})
    if not parent_invoice:
        raise HTTPException(status_code=404, detail="Parent Invoice not found")
        
    # 3. Deduct note amount from invoice balance due
    new_balance = parent_invoice.get("balanceDue", 0) - note.totalAmount
    invoices_collection.update_one(
        {"_id": ObjectId(note.invoiceId)},
        {"$set": {"balanceDue": round(new_balance, 2)}}
    )
    
    note_dict = note.model_dump()
    result = credit_notes_collection.insert_one(note_dict)
    
    return {
        "message": "Credit Note created and Invoice balance adjusted",
        "id": str(result.inserted_id)
    }

@router.get("/credit-notes")
def get_credit_notes(admin_user: str = Depends(get_current_admin)):
    notes = []
    for note in credit_notes_collection.find():
        note["_id"] = str(note["_id"])
        notes.append(note)
    return notes

@router.get("/credit-notes/{note_id}")
def get_credit_note(note_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid Credit Note ID format")
        
    note = credit_notes_collection.find_one({"_id": ObjectId(note_id)})
    if not note:
        raise HTTPException(status_code=404, detail="Credit Note not found")
        
    note["_id"] = str(note["_id"])
    return note

@router.put("/credit-notes/{note_id}")
def update_credit_note(note_id: str, note_data: UpdateCreditNoteModel, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid Credit Note ID format")
        
    existing_note = credit_notes_collection.find_one({"_id": ObjectId(note_id)})
    if not existing_note:
        raise HTTPException(status_code=404, detail="Credit Note not found")
        
    update_data = {k: v for k, v in note_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    # If total amount changed, adjust the parent invoice balance due
    if "totalAmount" in update_data and update_data["totalAmount"] != existing_note.get("totalAmount", 0):
        parent_invoice = invoices_collection.find_one({"_id": ObjectId(existing_note["invoiceId"])})
        if parent_invoice:
            diff = update_data["totalAmount"] - existing_note.get("totalAmount", 0)
            new_balance = parent_invoice.get("balanceDue", 0) - diff
            invoices_collection.update_one(
                {"_id": ObjectId(existing_note["invoiceId"])},
                {"$set": {"balanceDue": round(new_balance, 2)}}
            )
            
    result = credit_notes_collection.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": update_data}
    )
    
    return {"message": "Credit Note updated and parent Invoice balance adjusted"}

@router.delete("/credit-notes/{note_id}")
def delete_credit_note(note_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid Credit Note ID format")
        
    existing_note = credit_notes_collection.find_one({"_id": ObjectId(note_id)})
    if not existing_note:
        raise HTTPException(status_code=404, detail="Credit Note not found")
        
    # Reverse balance adjustment on parent invoice
    parent_invoice = invoices_collection.find_one({"_id": ObjectId(existing_note["invoiceId"])})
    if parent_invoice:
        new_balance = parent_invoice.get("balanceDue", 0) + existing_note.get("totalAmount", 0)
        invoices_collection.update_one(
            {"_id": ObjectId(existing_note["invoiceId"])},
            {"$set": {"balanceDue": round(new_balance, 2)}}
        )
        
    credit_notes_collection.delete_one({"_id": ObjectId(note_id)})
    return {"message": "Credit Note deleted and Invoice balance restored"}
