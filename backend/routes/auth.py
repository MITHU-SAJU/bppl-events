from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from models.admin import AdminLogin
from database import admins_collection
import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone

router = APIRouter()

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET", "my_super_secret_key_for_events_app")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

def get_current_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token payload: missing sub"
            )
        return username
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

@router.post("/admin/login")
def admin_login(admin_data: AdminLogin):
    # 1. Find the admin in the database
    admin = admins_collection.find_one({"username": admin_data.username})
    
    # 2. Check if admin exists and password matches
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid username or password"
        )
        
    # Verify password using bcrypt directly
    is_valid = bcrypt.checkpw(
        admin_data.password.encode('utf-8'), 
        admin["password"].encode('utf-8')
    )
    
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid username or password"
        )
    
    # 3. Create the JWT token
    expiration = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token_data = {"sub": admin["username"], "exp": expiration}
    token = jwt.encode(token_data, SECRET_KEY, algorithm=ALGORITHM)
    
    # 4. Return success response
    return {
        "success": True,
        "token": token
    }

# ---------------------------------------------------------
# Helper Endpoint for testing: Create an initial admin user
# ---------------------------------------------------------
@router.post("/admin/register")
def create_initial_admin(admin_data: AdminLogin):
    # Check if admin already exists
    if admins_collection.find_one({"username": admin_data.username}):
        raise HTTPException(status_code=400, detail="Admin already exists")
    
    # Hash the password using bcrypt directly
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(admin_data.password.encode('utf-8'), salt).decode('utf-8')
    
    # Save to database
    admin_record = {
        "username": admin_data.username,
        "password": hashed_password
    }
    admins_collection.insert_one(admin_record)
    
    return {"message": "Admin user created successfully!"}
