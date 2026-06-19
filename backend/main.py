from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.auth import router as auth_router
from routes.events import router as events_router
from routes.employees import router as employees_router
from routes.particulars import router as particulars_router
import os

app = FastAPI()

app.include_router(auth_router)
app.include_router(events_router)
app.include_router(employees_router)
app.include_router(particulars_router)

# CORS configuration
allowed_origins_raw = os.getenv("CORS_ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_raw.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://bppl-events.netlify.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Event Tracker API Running"
    }
