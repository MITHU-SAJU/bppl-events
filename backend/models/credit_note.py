from pydantic import BaseModel
from typing import List, Optional

class CreditNoteItem(BaseModel):
    description: str
    quantity: float
    rate: float
    amount: float

class CreditNoteModel(BaseModel):
    invoiceNumber: str  # The Credit Note's own unique number (CN-...)
    invoiceDate: str
    eventDate: Optional[str] = ""
    
    # Bill To
    clientName: str
    companyName: Optional[str] = ""
    clientAddress: Optional[str] = ""
    clientEmail: Optional[str] = ""
    clientGst: Optional[str] = ""
    
    # Link to parent invoice
    invoiceId: str
    parentInvoiceNumber: str
    
    # Items
    items: List[CreditNoteItem]
    
    # Financial breakdown
    subtotal: float
    cgstRate: Optional[float] = 9.0
    cgstAmount: float
    sgstRate: Optional[float] = 9.0
    sgstAmount: float
    totalAmount: float
    paidAmount: Optional[float] = 0.0
    paidDate: Optional[str] = ""
    balanceDue: float
    totalAmountWords: Optional[str] = ""
    
    # Bank & Payment instructions
    bankAccountName: Optional[str] = "Beats Production Private Limited"
    bankAccountNumber: Optional[str] = "50200099233710"
    bankIfsc: Optional[str] = "HDFC0004053"
    bankName: Optional[str] = "HDFC Bank"
    
    # Standard notes and terms
    notes: Optional[str] = ""
    terms: Optional[str] = ""
    status: str = "Draft"

class UpdateCreditNoteModel(BaseModel):
    invoiceNumber: Optional[str] = None
    invoiceDate: Optional[str] = None
    eventDate: Optional[str] = None
    clientName: Optional[str] = None
    companyName: Optional[str] = None
    clientAddress: Optional[str] = None
    clientEmail: Optional[str] = None
    clientGst: Optional[str] = None
    invoiceId: Optional[str] = None
    parentInvoiceNumber: Optional[str] = None
    items: Optional[List[CreditNoteItem]] = None
    subtotal: Optional[float] = None
    cgstRate: Optional[float] = None
    cgstAmount: Optional[float] = None
    sgstRate: Optional[float] = None
    sgstAmount: Optional[float] = None
    totalAmount: Optional[float] = None
    paidAmount: Optional[float] = None
    paidDate: Optional[str] = None
    balanceDue: Optional[float] = None
    totalAmountWords: Optional[str] = None
    bankAccountName: Optional[str] = None
    bankAccountNumber: Optional[str] = None
    bankIfsc: Optional[str] = None
    bankName: Optional[str] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = None
