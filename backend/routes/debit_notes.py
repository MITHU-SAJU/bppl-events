from fastapi import APIRouter, HTTPException, Depends
from database import debit_notes_collection, invoices_collection
from models.debit_note import DebitNoteModel, UpdateDebitNoteModel
from bson import ObjectId
from routes.auth import get_current_admin

router = APIRouter()

@router.post("/debit-notes")
def create_debit_note(note: DebitNoteModel, admin_user: str = Depends(get_current_admin)):
    # 1. Check if Debit Note number already exists
    if debit_notes_collection.find_one({"invoiceNumber": note.invoiceNumber}):
        raise HTTPException(status_code=400, detail="Debit Note number already exists")
        
    # 2. Check if parent invoice exists
    if not ObjectId.is_valid(note.invoiceId):
        raise HTTPException(status_code=400, detail="Invalid parent Invoice ID format")
    parent_invoice = invoices_collection.find_one({"_id": ObjectId(note.invoiceId)})
    if not parent_invoice:
        raise HTTPException(status_code=404, detail="Parent Invoice not found")
        
    # 3. Add note amount to invoice balance due
    new_balance = parent_invoice.get("balanceDue", 0) + note.totalAmount
    invoices_collection.update_one(
        {"_id": ObjectId(note.invoiceId)},
        {"$set": {"balanceDue": round(new_balance, 2)}}
    )
    
    note_dict = note.model_dump()
    result = debit_notes_collection.insert_one(note_dict)
    
    return {
        "message": "Debit Note created and Invoice balance adjusted",
        "id": str(result.inserted_id)
    }

@router.get("/debit-notes")
def get_debit_notes(admin_user: str = Depends(get_current_admin)):
    notes = []
    for note in debit_notes_collection.find():
        note["_id"] = str(note["_id"])
        notes.append(note)
    return notes

@router.get("/debit-notes/{note_id}")
def get_debit_note(note_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid Debit Note ID format")
        
    note = debit_notes_collection.find_one({"_id": ObjectId(note_id)})
    if not note:
        raise HTTPException(status_code=404, detail="Debit Note not found")
        
    note["_id"] = str(note["_id"])
    return note

@router.put("/debit-notes/{note_id}")
def update_debit_note(note_id: str, note_data: UpdateDebitNoteModel, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid Debit Note ID format")
        
    existing_note = debit_notes_collection.find_one({"_id": ObjectId(note_id)})
    if not existing_note:
        raise HTTPException(status_code=404, detail="Debit Note not found")
        
    update_data = {k: v for k, v in note_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    # If total amount changed, adjust the parent invoice balance due
    if "totalAmount" in update_data and update_data["totalAmount"] != existing_note.get("totalAmount", 0):
        parent_invoice = invoices_collection.find_one({"_id": ObjectId(existing_note["invoiceId"])})
        if parent_invoice:
            diff = update_data["totalAmount"] - existing_note.get("totalAmount", 0)
            new_balance = parent_invoice.get("balanceDue", 0) + diff
            invoices_collection.update_one(
                {"_id": ObjectId(existing_note["invoiceId"])},
                {"$set": {"balanceDue": round(new_balance, 2)}}
            )
            
    result = debit_notes_collection.update_one(
        {"_id": ObjectId(note_id)},
        {"$set": update_data}
    )
    
    return {"message": "Debit Note updated and parent Invoice balance adjusted"}

@router.delete("/debit-notes/{note_id}")
def delete_debit_note(note_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(note_id):
        raise HTTPException(status_code=400, detail="Invalid Debit Note ID format")
        
    existing_note = debit_notes_collection.find_one({"_id": ObjectId(note_id)})
    if not existing_note:
        raise HTTPException(status_code=404, detail="Debit Note not found")
        
    # Reverse balance adjustment on parent invoice
    parent_invoice = invoices_collection.find_one({"_id": ObjectId(existing_note["invoiceId"])})
    if parent_invoice:
        new_balance = parent_invoice.get("balanceDue", 0) - existing_note.get("totalAmount", 0)
        invoices_collection.update_one(
            {"_id": ObjectId(existing_note["invoiceId"])},
            {"$set": {"balanceDue": round(new_balance, 2)}}
        )
        
    debit_notes_collection.delete_one({"_id": ObjectId(note_id)})
    return {"message": "Debit Note deleted and Invoice balance restored"}
