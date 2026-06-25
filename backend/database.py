from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv()


client = MongoClient(
    os.getenv("MONGO_URL")
)


database = client["Event_tracker"]


events_collection = database["events"]
admins_collection = database["admins"]
employees_collection = database["employees"]
particulars_collection = database["particulars"]
invoices_collection = database["invoices"]