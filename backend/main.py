from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.events import router as events_router
from routes.employees import router as employees_router
from routes.particulars import router as particulars_router
from routes.invoices import router as invoices_router
import os

app = FastAPI()

app.include_router(auth_router)
app.include_router(events_router)
app.include_router(employees_router)
app.include_router(particulars_router)
app.include_router(invoices_router)

# CORS configuration
allowed_origins = [
    "https://bppl-events.netlify.app",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
allowed_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS")
if allowed_origins_raw:
    additional_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]
    allowed_origins.extend(additional_origins)

allowed_origins = list(set(allowed_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    from database import client
    mongo_url = os.getenv("MONGO_URL")
    if not mongo_url:
        print("CRITICAL ERROR: MONGO_URL environment variable is NOT set in Render!")
        raise ValueError("MONGO_URL environment variable is not set")
    try:
        # Ping the database to verify connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB database.")
    except Exception as e:
        print(f"CRITICAL ERROR: Failed to connect to MongoDB. Error: {e}")
        raise e

    # SMTP variables check
    smtp_host = os.getenv("SMTP_HOST")
    smtp_user = os.getenv("SMTP_USER")
    smtp_password = os.getenv("SMTP_PASSWORD")
    admin_email = os.getenv("ADMIN_EMAIL")
    
    missing_smtp = []
    if not smtp_host: missing_smtp.append("SMTP_HOST")
    if not smtp_user: missing_smtp.append("SMTP_USER")
    if not smtp_password: missing_smtp.append("SMTP_PASSWORD")
    if not admin_email: missing_smtp.append("ADMIN_EMAIL")
    
    if missing_smtp:
        print(f"[WARNING] SMTP settings are incomplete. Missing environment variables on Render: {', '.join(missing_smtp)}")
    else:
        print("[INFO] SMTP configuration is fully loaded on Render.")

@app.get("/")
def home():
    return {
        "message": "Event Tracker API Running"
    }
