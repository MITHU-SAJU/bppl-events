from fastapi import APIRouter, HTTPException, Depends
from database import clients_collection
from models.client import ClientModel, UpdateClientModel
from bson import ObjectId
from routes.auth import get_current_admin
from typing import Optional

router = APIRouter()

@router.post("/clients")
def create_client(client: ClientModel, admin_user: str = Depends(get_current_admin)):
    # Check if a client with the same mobile number already exists
    if clients_collection.find_one({"mobileNumber": client.mobileNumber}):
        raise HTTPException(status_code=400, detail="Client with this mobile number already exists")
    
    client_dict = client.model_dump()
    result = clients_collection.insert_one(client_dict)
    
    return {
        "message": "Client created successfully",
        "id": str(result.inserted_id)
    }

@router.get("/clients")
def get_clients(
    search: Optional[str] = None,
    skip: int = 0,
    limit: int = 20,
    admin_user: str = Depends(get_current_admin)
):
    query = {}
    if search:
        regex_search = {"$regex": search, "$options": "i"}
        query["$or"] = [
            {"clientName": regex_search},
            {"companyName": regex_search},
            {"mobileNumber": regex_search},
            {"gstNumber": regex_search}
        ]
        
    total = clients_collection.count_documents(query)
    
    clients = []
    # If limit is 0 or -1, get all records (useful for dropdown lists)
    if limit <= 0:
        cursor = clients_collection.find(query)
    else:
        cursor = clients_collection.find(query).skip(skip).limit(limit)
        
    for c in cursor:
        c["_id"] = str(c["_id"])
        clients.append(c)
        
    return {
        "total": total,
        "clients": clients
    }

@router.get("/clients/{client_id}")
def get_client(client_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(client_id):
        raise HTTPException(status_code=400, detail="Invalid Client ID format")
    
    client = clients_collection.find_one({"_id": ObjectId(client_id)})
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    client["_id"] = str(client["_id"])
    return client

@router.put("/clients/{client_id}")
def update_client(client_id: str, client_data: UpdateClientModel, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(client_id):
        raise HTTPException(status_code=400, detail="Invalid Client ID format")
        
    update_data = {k: v for k, v in client_data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    # Check if another client has the same mobile number
    if "mobileNumber" in update_data:
        existing = clients_collection.find_one({"mobileNumber": update_data["mobileNumber"]})
        if existing and str(existing["_id"]) != client_id:
            raise HTTPException(status_code=400, detail="Another client has this mobile number")
            
    result = clients_collection.update_one(
        {"_id": ObjectId(client_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
        
    return {"message": "Client updated successfully"}

@router.delete("/clients/{client_id}")
def delete_client(client_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(client_id):
        raise HTTPException(status_code=400, detail="Invalid Client ID format")
        
    result = clients_collection.delete_one({"_id": ObjectId(client_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client not found")
        
    return {"message": "Client deleted successfully"}
