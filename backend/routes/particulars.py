from fastapi import APIRouter, HTTPException, Depends
from database import particulars_collection
from models.particular import ParticularModel
from bson import ObjectId
from routes.auth import get_current_admin

router = APIRouter()

# Default particulars list to seed
DEFAULT_PARTICULARS = [
    # Photo Booths
    {"name": "360 Degree Video Booth", "category": "Photo Booths"},
    {"name": "Instant Booth without Print", "category": "Photo Booths"},
    {"name": "AI Booth", "category": "Photo Booths"},
    {"name": "Green Screen Booth", "category": "Photo Booths"},
    {"name": "Green Screen 360 degree Booth", "category": "Photo Booths"},
    {"name": "Word cloud Booth AI", "category": "Photo Booths"},
    {"name": "Stand Alone Booth Ring light", "category": "Photo Booths"},
    {"name": "Toon Me Booth", "category": "Photo Booths"},
    {"name": "360 Degree Video Booth BIKE", "category": "Photo Booths"},
    {"name": "Photo Strip Booth", "category": "Photo Booths"},
    {"name": "Treadmill Green Screen video Booth", "category": "Photo Booths"},
    {"name": "Jump Gif booth", "category": "Photo Booths"},

    # Games
    {"name": "VR headset Meta oculus", "category": "Games"},
    {"name": "Catch the button", "category": "Games"},
    {"name": "Batak", "category": "Games"},
    {"name": "Touch me not", "category": "Games"},
    {"name": "Card distributer", "category": "Games"},
    {"name": "Kinect MS sensor", "category": "Games"},
    {"name": "Quiz Buzzer sensor with display", "category": "Games"},

    # Drones 500grm
    {"name": "Box Branding", "category": "Drones 500grm"},
    {"name": "Box Branding with Drop", "category": "Drones 500grm"},
    {"name": "Stage Act", "category": "Drones 500grm"},
    {"name": "Dropping on stage", "category": "Drones 500grm"},

    # Robots
    {"name": "Rover", "category": "Robots"},
    {"name": "Hydraulic or Actuators motor", "category": "Robots"},
    {"name": "Truck miniature", "category": "Robots"},
    {"name": "Do Bot", "category": "Robots"},
    {"name": "Temi Humanoids", "category": "Robots"},
    {"name": "Cable Carrier", "category": "Robots"},

    # Hologram fan
    {"name": "Hologram fan 65cm Single fan", "category": "Hologram fan"},
    {"name": "Hologram fan 65cm 3set fan", "category": "Hologram fan"},
    {"name": "Hologram fan 65cm 9 set fan", "category": "Hologram fan"},
    {"name": "Hologram fan 42cm", "category": "Hologram fan"},
    {"name": "3D hologram fan acrylic 32cm", "category": "Hologram fan"},
    {"name": "3D desktop LED hologram fan", "category": "Hologram fan"},
    {"name": "Table Top Hologram fan", "category": "Hologram fan"},

    # Sensors Activities & IOT devices
    {"name": "Paparazzi", "category": "Sensors Activities & IOT devices"},
    {"name": "Audio Trigger", "category": "Sensors Activities & IOT devices"},
    {"name": "Video Trigger", "category": "Sensors Activities & IOT devices"},
    {"name": "Electro Gen Steps pad", "category": "Sensors Activities & IOT devices"},
    {"name": "banana Piano / Drums", "category": "Sensors Activities & IOT devices"},
    {"name": "Touch Sensors", "category": "Sensors Activities & IOT devices"},
    {"name": "Gesture Sensor (leap Motion)", "category": "Sensors Activities & IOT devices"},
    {"name": "Kinect MS sensor", "category": "Sensors Activities & IOT devices"},
    {"name": "Digital Signage System (pi3)", "category": "Sensors Activities & IOT devices"},
    {"name": "Boat Headset", "category": "Sensors Activities & IOT devices"},

    # Web Applications SDK
    {"name": "Web Depth camera for CV ML", "category": "Web Applications SDK"},
    {"name": "IOT devices", "category": "Web Applications SDK"},
    {"name": "Web Application", "category": "Web Applications SDK"},
    {"name": "Touch Sensor Activities", "category": "Web Applications SDK"},

    # Workshop & Fun
    {"name": "3D pen", "category": "Workshop & Fun"},
    {"name": "Circuit making", "category": "Workshop & Fun"},
    {"name": "Scribble bots", "category": "Workshop & Fun"},
    {"name": "Line following bots", "category": "Workshop & Fun"},
    {"name": "Drone", "category": "Workshop & Fun"},

    # Printers
    {"name": "Photo Printer pm520", "category": "Printers"},
    {"name": "Epson l35420", "category": "Printers"},
    {"name": "Lazer printer Epson", "category": "Printers"},
    {"name": "Brother Label Printer 800/810", "category": "Printers"},
    {"name": "Mug Printer", "category": "Printers"},
    {"name": "T shirt Printing", "category": "Printers"},
    {"name": "Lazer Engraving", "category": "Printers"},

    # Casting
    {"name": "Apple TV", "category": "Casting"},
    {"name": "iPhone", "category": "Casting"},
    {"name": "IPAD", "category": "Casting"},
    {"name": "Meshes Wi-Fi router", "category": "Casting"},
    {"name": "TP Link with sim", "category": "Casting"},

    # Projection
    {"name": "GOBOS Lamps color", "category": "Projection"}
]

def seed_particulars():
    try:
        count = particulars_collection.count_documents({})
        if count == 0:
            print("Seeding default particulars...")
            particulars_collection.insert_many(DEFAULT_PARTICULARS)
            print("Successfully seeded particulars database.")
    except Exception as e:
        print(f"Error seeding particulars: {e}")

# Call seed function
seed_particulars()

@router.get("/particulars")
def get_particulars():
    particulars = []
    for part in particulars_collection.find():
        part["_id"] = str(part["_id"])
        particulars.append(part)
    return particulars

@router.post("/particulars")
def create_particular(particular: ParticularModel):
    # Check if duplicate name (case insensitive)
    existing = particulars_collection.find_one({"name": {"$regex": f"^{particular.name}$", "$options": "i"}})
    if existing:
        raise HTTPException(status_code=400, detail="Service already exists")
    
    part_dict = particular.model_dump()
    result = particulars_collection.insert_one(part_dict)
    part_dict["_id"] = str(result.inserted_id)
    return part_dict

@router.delete("/particulars/{part_id}")
def delete_particular(part_id: str, admin_user: str = Depends(get_current_admin)):
    if not ObjectId.is_valid(part_id):
        raise HTTPException(status_code=400, detail="Invalid Service ID format")
        
    result = particulars_collection.delete_one({"_id": ObjectId(part_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
        
    return {"message": "Service deleted successfully"}
