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
quotations_collection = database["quotations"]
proformas_collection = database["proformas"]
credit_notes_collection = database["credit_notes"]
debit_notes_collection = database["debit_notes"]
clients_collection = database["clients"]