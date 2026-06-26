import { useState, useEffect } from "react";
import { getInvoices, createInvoice, updateInvoice, deleteInvoice, getClients } from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import beatslogo from "../assets/beats-logo.jpg";

const DEFAULT_TERMS = `a) All prices quoted by BP may be amended when agreed with the Client and the Client will reasonably consider any errors or omissions or where an increase is caused by a change in the circumstances beyond the reasonable control of BP.
b) Any query arising from an invoice must be notified to BP in writing by the Client within 24 hours of the date of the invoice receipt. Failure to comply will render the full invoice payable on the due date.
c) It is strictly the responsibility of the representative of the Client confirming the booking to inform all relevant parties of the payment terms, as set out by BP.
d) Deposit – A deposit of 50% of the total fee payable (including GST), as quoted and agreed in the written proposal (attached), of any event or programme shall be payable on confirmation of the order. The remaining 50% shall be known as the "balance".
e) Balance Due – the balance of the total fee shall be payable at the end of the same event date.
f) Additional Expenses – any additional expenses or fees resulting from any changes made by the Client, that have not been quoted in the agreed proposal but subsequently incurred by BP, will be invoiced separately after the event.
g) BP will agree on any additional expenses or fees with the client prior to these being incurred. Liability At some events, the activities that the Clients will undertake may be inherently dangerous throughout all guests are fully supervised throughout. As such neither BP nor its employees or agents shall be liable for any damage, loss, delay, or expenses caused to the client, its employees, agents, licensees or invitees, or any other persons attending the event except insofar as it results from the negligence of BP or breach of contract. Please note that during particular events and on certain activities it may be necessary to request individuals to sign a liability waiver on the day of the event (although the same does not purport to exclude liability for damage to personal property of the Clients employees or staff or property damage caused to the Clients property or personal injury arising as a result of the negligence of BP), in which instances BP agrees to indemnify and hold the Client harmless against all such claims.`;

// Indian Number to Words Converter
function numberToWordsINR(num) {
  if (num === 0) return "Zero Rupees Only";
  
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const g = ["", "Thousand", "Lakh", "Crore"];
  
  // Format to standard 2 decimal float
  const formattedNum = parseFloat(num).toFixed(2);
  const parts = formattedNum.split(".");
  const integerPart = parseInt(parts[0], 10);
  const decimalPart = parseInt(parts[1], 10);
  
  function helper(n) {
    if (n === 0) return "";
    else if (n < 20) return a[n] + " ";
    else if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10] + " ";
    else return a[Math.floor(n / 100)] + " Hundred " + helper(n % 100);
  }
  
  let res = "";
  let temp = integerPart;
  
  // Crore
  const crore = Math.floor(temp / 10000000);
  temp = temp % 10000000;
  if (crore > 0) {
    res += helper(crore) + "Crore ";
  }
  
  // Lakh
  const lakh = Math.floor(temp / 100000);
  temp = temp % 100000;
  if (lakh > 0) {
    res += helper(lakh) + "Lakh ";
  }
  
  // Thousand
  const thousand = Math.floor(temp / 1000);
  temp = temp % 1000;
  if (thousand > 0) {
    res += helper(thousand) + "Thousand ";
  }
  
  // Hundreds/Tens/Ones
  if (temp > 0) {
    res += helper(temp);
  }
  
  res = res.trim() + " Rupees";
  
  if (decimalPart > 0) {
    res += " and " + helper(decimalPart).trim() + " Paise";
  }
  
  return res + " Only";
}

// Format date into "02 May, 2026" style
function formatDateShort(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month}, ${year}`;
  } catch (e) {
    return dateStr;
  }
}

// Formats number to Indian currency layout: e.g. 1,71,100.00
function formatINR(amount) {
  if (amount === undefined || amount === null) return "0.00";
  const num = parseFloat(amount);
  if (isNaN(num)) return "0.00";
  
  // Indian currency numbering format
  const parts = num.toFixed(2).split(".");
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherDigits = parts[0].substring(0, parts[0].length - 3);
  if (otherDigits !== "") {
    lastThree = "," + lastThree;
  }
  const formattedInteger = otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
  return formattedInteger + "." + parts[1];
}

function AdminInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states: "list", "add", "edit", "preview"
  const [viewState, setViewState] = useState("list");
  
  // Client Master Selection states
  const [clients, setClients] = useState([]);
  const [clientSearch, setClientSearch] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    eventDate: "",
    clientName: "",
    companyName: "",
    clientAddress: "",
    clientGst: "",
    clientEmail: "",
    items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
    subtotal: 0,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    totalAmount: 0,
    paidAmount: 0,
    paidDate: "",
    balanceDue: 0,
    totalAmountWords: "",
    bankAccountName: "Beats Production Private Limited",
    bankAccountNumber: "50200099233710",
    bankIfsc: "HDFC0004053",
    bankName: "HDFC Bank",
    notes: "",
    terms: DEFAULT_TERMS,
    status: "Pending"
  });
  
  const [currentId, setCurrentId] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    loadInvoices();
    loadClientsForDropdown();
  }, []);

  const loadClientsForDropdown = async () => {
    try {
      const res = await getClients("", 0, 0);
      setClients(res.data.clients || []);
    } catch (e) {
      console.error("Error loading clients list:", e);
    }
  };

  const filteredClients = clients.filter(c => {
    const term = clientSearch.toLowerCase();
    return (
      (c.clientName || "").toLowerCase().includes(term) ||
      (c.companyName || "").toLowerCase().includes(term) ||
      (c.mobileNumber || "").includes(term) ||
      (c.gstNumber || "").toLowerCase().includes(term)
    );
  });

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await getInvoices();
      setInvoices(res.data.reverse());
    } catch (e) {
      console.error("Error loading invoices:", e);
    } finally {
      setLoading(false);
    }
  };

  const generateInvoiceNumber = () => {
    const prefix = "BP";
    const dateObj = new Date();
    const year = dateObj.getFullYear();
    const shortYear = String(year).substring(2);
    const nextYearShort = String(year + 1).substring(2);
    // Format: BP-2026-27-01 (where 01 is sequential or random)
    const randomSuffix = String(Math.floor(1 + Math.random() * 99)).padStart(2, "0");
    return `${prefix}-${year}-${nextYearShort}-${randomSuffix}`;
  };

  const handleOpenAddForm = () => {
    setInvoiceForm({
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: new Date().toISOString().split("T")[0],
      eventDate: "",
      clientName: "",
      companyName: "",
      clientAddress: "",
      clientGst: "",
      clientEmail: "",
      items: [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      subtotal: 0,
      cgstRate: 9,
      cgstAmount: 0,
      sgstRate: 9,
      sgstAmount: 0,
      totalAmount: 0,
      paidAmount: 0,
      paidDate: "",
      balanceDue: 0,
      totalAmountWords: "Zero Rupees Only",
      bankAccountName: "Beats Production Private Limited",
      bankAccountNumber: "50200099233710",
      bankIfsc: "HDFC0004053",
      bankName: "HDFC Bank",
      notes: "",
      terms: DEFAULT_TERMS,
      status: "Pending"
    });
    setClientSearch("");
    setDropdownOpen(false);
    setErrorMsg("");
    setSuccessMsg("");
    setViewState("add");
  };

  const handleOpenEditForm = (invoice) => {
    setCurrentId(invoice._id);
    setInvoiceForm({
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      eventDate: invoice.eventDate || "",
      clientName: invoice.clientName,
      companyName: invoice.companyName || "",
      clientAddress: invoice.clientAddress || "",
      clientGst: invoice.clientGst || "",
      clientEmail: invoice.clientEmail || "",
      items: invoice.items.length > 0 ? invoice.items : [{ description: "", quantity: 1, rate: 0, amount: 0 }],
      subtotal: invoice.subtotal || 0,
      cgstRate: invoice.cgstRate !== undefined ? invoice.cgstRate : 9,
      cgstAmount: invoice.cgstAmount || 0,
      sgstRate: invoice.sgstRate !== undefined ? invoice.sgstRate : 9,
      sgstAmount: invoice.sgstAmount || 0,
      totalAmount: invoice.totalAmount || 0,
      paidAmount: invoice.paidAmount || 0,
      paidDate: invoice.paidDate || "",
      balanceDue: invoice.balanceDue || 0,
      totalAmountWords: invoice.totalAmountWords || "",
      bankAccountName: invoice.bankAccountName || "Beats Production Private Limited",
      bankAccountNumber: invoice.bankAccountNumber || "50200099233710",
      bankIfsc: invoice.bankIfsc || "HDFC0004053",
      bankName: invoice.bankName || "HDFC Bank",
      notes: invoice.notes || "",
      terms: invoice.terms || DEFAULT_TERMS,
      status: invoice.status || "Pending"
    });
    setClientSearch(invoice.companyName ? `${invoice.companyName} (${invoice.clientName})` : invoice.clientName || "");
    setDropdownOpen(false);
    setErrorMsg("");
    setSuccessMsg("");
    setViewState("edit");
  };

  const handleOpenPreview = (invoice) => {
    handleOpenEditForm(invoice);
    setViewState("preview");
  };

  // Recalculates all dependent financial amounts
  const recalculateAmounts = (items, cgstRate, sgstRate, paidAmount) => {
    const sub = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const cgst = parseFloat((sub * (cgstRate / 100)).toFixed(2));
    const sgst = parseFloat((sub * (sgstRate / 100)).toFixed(2));
    const total = parseFloat((sub + cgst + sgst).toFixed(2));
    const bal = parseFloat((total - paidAmount).toFixed(2));
    const words = numberToWordsINR(total);

    return {
      subtotal: sub,
      cgstAmount: cgst,
      sgstAmount: sgst,
      totalAmount: total,
      balanceDue: bal,
      totalAmountWords: words
    };
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...invoiceForm.items];
    const item = { ...updatedItems[index] };
    
    if (field === "quantity") {
      item.quantity = parseFloat(value) || 0;
      item.amount = parseFloat((item.quantity * item.rate).toFixed(2));
    } else if (field === "rate") {
      item.rate = parseFloat(value) || 0;
      item.amount = parseFloat((item.quantity * item.rate).toFixed(2));
    } else {
      item[field] = value;
    }
    updatedItems[index] = item;

    const calc = recalculateAmounts(
      updatedItems, 
      invoiceForm.cgstRate, 
      invoiceForm.sgstRate, 
      invoiceForm.paidAmount
    );
    
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
      ...calc
    });
  };

  const handleAddItemRow = () => {
    const updatedItems = [...invoiceForm.items, { description: "", quantity: 1, rate: 0, amount: 0 }];
    const calc = recalculateAmounts(
      updatedItems, 
      invoiceForm.cgstRate, 
      invoiceForm.sgstRate, 
      invoiceForm.paidAmount
    );
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
      ...calc
    });
  };

  const handleRemoveItemRow = (index) => {
    if (invoiceForm.items.length === 1) return;
    const updatedItems = invoiceForm.items.filter((_, idx) => idx !== index);
    const calc = recalculateAmounts(
      updatedItems, 
      invoiceForm.cgstRate, 
      invoiceForm.sgstRate, 
      invoiceForm.paidAmount
    );
    setInvoiceForm({
      ...invoiceForm,
      items: updatedItems,
      ...calc
    });
  };

  const handleFinancialFieldChange = (field, value) => {
    const updatedForm = { ...invoiceForm, [field]: parseFloat(value) || 0 };
    const calc = recalculateAmounts(
      updatedForm.items,
      updatedForm.cgstRate,
      updatedForm.sgstRate,
      updatedForm.paidAmount
    );
    setInvoiceForm({
      ...updatedForm,
      ...calc
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!invoiceForm.invoiceNumber.trim()) {
      setErrorMsg("Invoice number is required.");
      return;
    }

    const hasEmptyItem = invoiceForm.items.some(item => !item.description.trim());
    if (hasEmptyItem) {
      setErrorMsg("Please enter description for all items.");
      return;
    }

    try {
      if (viewState === "add") {
        await createInvoice(invoiceForm);
        setSuccessMsg("Invoice created successfully!");
      } else {
        await updateInvoice(currentId, invoiceForm);
        setSuccessMsg("Invoice updated successfully!");
      }
      
      setTimeout(() => {
        setViewState("list");
        loadInvoices();
      }, 1000);
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || "An error occurred while saving the invoice.");
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (window.confirm("Are you sure you want to delete this invoice?")) {
      try {
        await deleteInvoice(id);
        loadInvoices();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete invoice");
      }
    }
  };

  const triggerPrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const page1 = document.getElementById("invoice-page-1");
    const page2 = document.getElementById("invoice-page-2");
    
    if (!page1 || !page2) return;
    
    // Create temporary division wrapper to pack the PDF elements
    const element = document.createElement("div");
    
    // Apply styling so it matches screen/print perfectly
    element.style.background = "#ffffff";
    element.style.color = "#000000";
    element.style.fontFamily = "Arial, sans-serif";
    element.style.width = "210mm";
    
    // Clone page 1
    const p1 = page1.cloneNode(true);
    p1.style.boxShadow = "none";
    p1.style.border = "none";
    p1.style.margin = "0";
    p1.style.padding = "20mm 15mm";
    p1.style.height = "auto";
    p1.style.minHeight = "0";
    p1.style.boxSizing = "border-box";
    p1.style.overflow = "visible";
    p1.style.position = "relative";
    element.appendChild(p1);
    
    // Clone page 2
    const p2 = page2.cloneNode(true);
    p2.style.boxShadow = "none";
    p2.style.border = "none";
    p2.style.margin = "0";
    p2.style.padding = "20mm 15mm";
    p2.style.height = "auto";
    p2.style.minHeight = "0";
    p2.style.boxSizing = "border-box";
    p2.style.overflow = "visible";
    p2.style.position = "relative";
    p2.style.pageBreakBefore = "always";
    element.appendChild(p2);
    
    const runHtml2Pdf = () => {
      const opt = {
        margin: 0,
        filename: `${invoiceForm.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save();
    };

    if (window.html2pdf) {
      runHtml2Pdf();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = runHtml2Pdf;
      document.body.appendChild(script);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-success text-white px-3 py-2 rounded-3 small fw-bold font-monospace";
      case "Unpaid":
        return "bg-danger text-white px-3 py-2 rounded-3 small fw-bold font-monospace";
      case "Pending":
        return "bg-warning text-dark px-3 py-2 rounded-3 small fw-bold font-monospace";
      case "Cancelled":
        return "bg-secondary text-white px-3 py-2 rounded-3 small fw-bold font-monospace";
      default:
        return "bg-dark text-white px-3 py-2 rounded-3 small fw-bold font-monospace";
    }
  };

  return (
    <div className="d-flex flex-column vh-100">
      
      {/* Dynamic Style Block for PDF High Fidelity Print Layout */}
      <style>{`
        @media print {
          /* Hide application container & nav elements */
          .d-flex.flex-column.vh-100, 
          .sidebar-container, 
          .navbar, 
          .btn, 
          .alert,
          .preview-toolbar,
          p.text-muted,
          h2 {
            display: none !important;
          }
          
          @page {
            size: A4;
            margin: 0;
          }
          
          /* Prepare print viewport */
          body, html {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            font-family: Arial, sans-serif !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Force display of the printing wrapper */
          .print-area-wrapper {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Page size configuration */
          .invoice-page {
            width: 210mm !important;
            height: 296mm !important;
            padding: 20mm 15mm !important;
            margin: 0 auto !important;
            box-sizing: border-box !important;
            page-break-after: always !important;
            position: relative !important;
            background: #ffffff !important;
            overflow: hidden !important;
          }

          .invoice-page:last-child {
            page-break-after: avoid !important;
          }
        }

        /* Screen Preview styles to emulate real paper sheet */
        .invoice-paper-preview {
          background-color: #ffffff;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border: 1px solid #ddd;
          width: 210mm;
          min-height: 297mm;
          padding: 20mm 15mm;
          margin: 0 auto 30px auto;
          box-sizing: border-box;
          position: relative;
          color: #111;
          font-family: Arial, Helvetica, sans-serif;
        }

        .pdf-table-header {
          background-color: #0066d4 !important;
          color: #ffffff !important;
          font-weight: bold;
          text-align: left;
        }

        .invoice-page .table td, 
        .invoice-page .table th {
          padding: 6px 10px !important;
          font-size: 0.8rem !important;
        }
        
        .invoice-page hr {
          margin: 10px 0 !important;
        }
      `}</style>

      {/* Top Navbar (hidden on print) */}
      <Navbar />

      <div className="d-flex flex-grow-1">
        {/* Left Sidebar (hidden on print) */}
        <Sidebar />
        
        <div className="flex-grow-1 p-4 fade-in" style={{ overflowY: "auto" }}>
          
          {/* Header Action Bars (hidden on print) */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-extrabold m-0" style={{ letterSpacing: "-1px" }}>
                {viewState === "list" && "Invoice Management"}
                {viewState === "add" && "Create Beats Production Invoice"}
                {viewState === "edit" && "Edit Beats Production Invoice"}
                {viewState === "preview" && "Print Invoice Preview"}
              </h2>
              <p className="text-muted small m-0 mt-1">
                {viewState === "list" && "Manage Beats Production Private Limited invoices"}
                {viewState === "add" && "Configure layout, GST breakdown, bank details and print specifications"}
                {viewState === "edit" && `Modify details for Beats Production Invoice: ${invoiceForm.invoiceNumber}`}
                {viewState === "preview" && "Emulated PDF layout view. Ready for print output."}
              </p>
            </div>
            
            <div className="d-flex gap-2">
              {viewState === "list" && (
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddForm}>
                  <span>➕</span> Create Invoice
                </button>
              )}
              {viewState === "preview" && (
                <>
                
                  <button className="btn btn-primary d-flex align-items-center gap-2 px-4 fw-bold" onClick={handleDownloadPDF}>
                    📥 Download PDF
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => setViewState("list")}>
                    Back to List
                  </button>
                </>
              )}
              {viewState !== "list" && viewState !== "preview" && (
                <button className="btn btn-outline-secondary" onClick={() => setViewState("list")}>
                  Back to List
                </button>
              )}
            </div>
          </div>

          {/* Success/Error Alerts (hidden on print) */}
          {errorMsg && (
            <div className="alert alert-danger border-0 shadow-sm fade-in mb-4 d-flex align-items-center gap-2">
              <span>⚠️</span> <div>{errorMsg}</div>
            </div>
          )}
          {successMsg && (
            <div className="alert alert-success border-0 shadow-sm fade-in mb-4 d-flex align-items-center gap-2">
              <span>✅</span> <div>{successMsg}</div>
            </div>
          )}

          {/* LIST VIEW */}
          {viewState === "list" && (
            <div className="card shadow-sm p-3 border-0">
              {loading ? (
                <div className="text-center my-5 py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="text-muted mt-2 small font-monospace">Fetching invoices...</div>
                </div>
              ) : (
                <div className="table-responsive border-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Invoice No.</th>
                        <th>Client</th>
                        <th>Invoice Date</th>
                        <th>Event Date</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th className="text-center" style={{ width: "260px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv._id}>
                          <td>
                            <strong className="text-primary font-monospace">{inv.invoiceNumber}</strong>
                          </td>
                          <td>
                            <div>
                              <div className="fw-bold text-dark">{inv.clientName}</div>
                              {inv.clientGst && (
                                <div className="text-muted small font-monospace">GST: {inv.clientGst}</div>
                              )}
                            </div>
                          </td>
                          <td className="font-monospace text-secondary">{formatDateShort(inv.invoiceDate)}</td>
                          <td className="text-secondary">{inv.eventDate || <em className="text-muted">None</em>}</td>
                          <td>
                            <span className="fw-extrabold text-dark font-monospace">
                              ₹{formatINR(inv.totalAmount)}
                            </span>
                            {(() => {
                              const expectedBalance = parseFloat((inv.totalAmount - (inv.paidAmount || 0)).toFixed(2));
                              const actualBalance = parseFloat((inv.balanceDue || 0).toFixed(2));
                              if (actualBalance < expectedBalance) {
                                return (
                                  <div style={{ marginTop: "2px" }}>
                                    <span className="badge bg-danger rounded-3 font-monospace" style={{ fontSize: "0.68rem" }}>
                                      Credited (Bal: ₹{formatINR(inv.balanceDue)})
                                    </span>
                                  </div>
                                );
                              } else if (actualBalance > expectedBalance) {
                                return (
                                  <div style={{ marginTop: "2px" }}>
                                    <span className="badge bg-success rounded-3 font-monospace" style={{ fontSize: "0.68rem" }}>
                                      Debited (Bal: ₹{formatINR(inv.balanceDue)})
                                    </span>
                                  </div>
                                );
                              }
                              return null;
                            })()}
                          </td>
                          <td>
                            <span className={getStatusBadgeClass(inv.status)}>
                              {inv.status}
                            </span>
                          </td>
                          <td className="text-center">
                            <button
                              className="btn btn-sm btn-info text-white me-2 px-3 fw-bold"
                              onClick={() => handleOpenPreview(inv)}
                            >
                              Print / Preview
                            </button>
                            <button
                              className="btn btn-sm btn-outline-primary me-2 px-2"
                              onClick={() => handleOpenEditForm(inv)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn-sm btn-danger px-2"
                              onClick={() => handleDeleteInvoice(inv._id)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {invoices.length === 0 && (
                        <tr>
                          <td colSpan="7" className="text-center py-5 text-muted">
                            <div className="mb-2" style={{ fontSize: "2rem" }}>📄</div>
                            <div>No invoices found. Create a new invoice to get started.</div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ADD / EDIT FORM VIEW */}
          {(viewState === "add" || viewState === "edit") && (
            <div className="card shadow-sm border-0 fade-in">
              <div className="card-header card-gradient-blue p-4 border-0">
                <h5 className="mb-0 fw-bold">Beats Production Invoice Details Form</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  
                  {/* General Details Rows */}
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Invoice Number</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control font-monospace fw-bold"
                          required
                          value={invoiceForm.invoiceNumber}
                          onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })}
                          placeholder="BP-2026-27-01"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setInvoiceForm({ ...invoiceForm, invoiceNumber: generateInvoiceNumber() })}
                          title="Generate Unique Invoice Number"
                        >
                          🔄
                        </button>
                      </div>
                    </div>
                    
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Invoice Date</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={invoiceForm.invoiceDate}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceDate: e.target.value })}
                      />
                    </div>
                    
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Event Date(s)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. 22,24 and 25april"
                        value={invoiceForm.eventDate}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, eventDate: e.target.value })}
                      />
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Invoice Status</label>
                      <select
                        className="form-select"
                        value={invoiceForm.status}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, status: e.target.value })}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Paid">Paid</option>
                        <option value="Unpaid">Unpaid</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Client Selector Dropdown */}
                  <h5 className="fw-bold mb-3">Bill To Information</h5>
                  <div className="row g-3 mb-3">
                    <div className="col-12 col-md-6 position-relative">
                      <label className="form-label font-monospace text-secondary small fw-bold">Select Client from Master (Searchable)</label>
                      <div className="input-group">
                        <span className="input-group-text bg-white border-end-0">🔍</span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search by Name, Company, Mobile or GST..."
                          value={clientSearch}
                          onChange={(e) => {
                            setClientSearch(e.target.value);
                            setDropdownOpen(true);
                          }}
                          onFocus={() => setDropdownOpen(true)}
                        />
                        {clientSearch && (
                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => {
                              setClientSearch("");
                              setDropdownOpen(false);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                      {dropdownOpen && filteredClients.length > 0 && (
                        <ul className="list-group position-absolute w-100 shadow-lg" style={{ zIndex: 1000, maxHeight: "200px", overflowY: "auto" }}>
                          {filteredClients.map(c => (
                            <li
                              key={c._id}
                              className="list-group-item list-group-item-action cursor-pointer"
                              style={{ cursor: "pointer" }}
                              onClick={() => {
                                const addrParts = [c.address, c.city, c.state, c.pincode].filter(Boolean);
                                setInvoiceForm(prev => ({
                                  ...prev,
                                  clientName: c.clientName || "",
                                  companyName: c.companyName || "",
                                  clientAddress: addrParts.join(", "),
                                  clientGst: c.gstNumber || "",
                                  clientEmail: c.email || ""
                                }));
                                setClientSearch(c.companyName ? `${c.companyName} (${c.clientName})` : c.clientName);
                                setDropdownOpen(false);
                              }}
                            >
                              <div className="fw-bold">{c.companyName || c.clientName}</div>
                              <div className="text-muted small">
                                Name: {c.clientName} | Mobile: {c.mobileNumber} {c.gstNumber ? `| GST: ${c.gstNumber}` : ""}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Client Name (Contact Person)</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={invoiceForm.clientName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, clientName: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Client Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={invoiceForm.companyName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, companyName: e.target.value })}
                        placeholder="Phase1 Events And Entertainment Pvt Ltd"
                      />
                    </div>
                    
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">Client Address</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        required
                        value={invoiceForm.clientAddress}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, clientAddress: e.target.value })}
                        placeholder="648, 100FT Road, Indiranagar, Bengaluru, 560038"
                      />
                    </div>
                    
                    <div className="col-12 col-md-2">
                      <label className="form-label font-monospace text-secondary small fw-bold">Client GSTIN</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={invoiceForm.clientGst}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, clientGst: e.target.value })}
                        placeholder="29AACCP2422J1ZG"
                      />
                    </div>

                   
                  </div>

                  {/* Bank Details configuration */}
                  <h5 className="fw-bold mb-3">Bank Instructions</h5>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Account Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={invoiceForm.bankAccountName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, bankAccountName: e.target.value })}
                        placeholder="Beats Production Private Limited"
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Account Number</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={invoiceForm.bankAccountNumber}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, bankAccountNumber: e.target.value })}
                        placeholder="50200099233710"
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">IFSC Code</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={invoiceForm.bankIfsc}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, bankIfsc: e.target.value })}
                        placeholder="HDFC0004053"
                      />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Bank Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={invoiceForm.bankName}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, bankName: e.target.value })}
                        placeholder="HDFC Bank"
                      />
                    </div>
                  </div>

                  {/* Items List Section */}
                  <hr className="my-4 border-secondary-subtle" />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Line Items</h5>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                      onClick={handleAddItemRow}
                    >
                      <span>➕</span> Add Item Row
                    </button>
                  </div>

                  <div className="table-responsive border-0 mb-4">
                    <table className="table align-middle table-hover mb-0">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th style={{ width: "120px" }}>Qty</th>
                          <th style={{ width: "180px" }}>Rate (₹)</th>
                          <th style={{ width: "180px" }}>Amount (₹)</th>
                          <th style={{ width: "80px" }} className="text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceForm.items.map((item, idx) => (
                          <tr key={idx} className="fade-in">
                            <td>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Dry Run / Event Day"
                                required
                                value={item.description}
                                onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control text-center font-monospace"
                                required
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-control text-end font-monospace"
                                required
                                min="0.00"
                                step="any"
                                value={item.rate}
                                onChange={(e) => handleItemChange(idx, "rate", e.target.value)}
                              />
                            </td>
                            <td className="text-end font-monospace fw-bold text-secondary">
                              ₹{formatINR(item.amount)}
                            </td>
                            <td className="text-center">
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger"
                                disabled={invoiceForm.items.length === 1}
                                onClick={() => handleRemoveItemRow(idx)}
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Calculations breakdown row */}
                  <div className="row g-4 mb-4">
                    <div className="col-12 col-md-6">
                      <div className="row g-3">
                        <div className="col-6">
                          <label className="form-label font-monospace text-secondary small fw-bold">CGST Rate (%)</label>
                          <input
                            type="number"
                            className="form-control font-monospace"
                            value={invoiceForm.cgstRate}
                            onChange={(e) => handleFinancialFieldChange("cgstRate", e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label font-monospace text-secondary small fw-bold">SGST Rate (%)</label>
                          <input
                            type="number"
                            className="form-control font-monospace"
                            value={invoiceForm.sgstRate}
                            onChange={(e) => handleFinancialFieldChange("sgstRate", e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label font-monospace text-secondary small fw-bold">Paid Amount (₹)</label>
                          <input
                            type="number"
                            className="form-control font-monospace text-primary fw-bold"
                            value={invoiceForm.paidAmount}
                            onChange={(e) => handleFinancialFieldChange("paidAmount", e.target.value)}
                          />
                        </div>
                        <div className="col-6">
                          <label className="form-label font-monospace text-secondary small fw-bold">Paid Date / Details</label>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Paid on 24 Apr, 2026"
                            value={invoiceForm.paidDate}
                            onChange={(e) => setInvoiceForm({ ...invoiceForm, paidDate: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="col-12 col-md-6">
                      <div className="card bg-light border-0 p-3 shadow-sm text-end">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary font-monospace small">Subtotal:</span>
                          <span className="fw-bold font-monospace">₹{formatINR(invoiceForm.subtotal)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary font-monospace small">CGST ({invoiceForm.cgstRate}%):</span>
                          <span className="fw-bold font-monospace">₹{formatINR(invoiceForm.cgstAmount)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary font-monospace small">SGST ({invoiceForm.sgstRate}%):</span>
                          <span className="fw-bold font-monospace">₹{formatINR(invoiceForm.sgstAmount)}</span>
                        </div>
                        <hr className="my-2 border-secondary-subtle" />
                        <div className="d-flex justify-content-between mb-2">
                          <span className="text-secondary font-monospace fw-bold text-primary">GRAND TOTAL:</span>
                          <span className="fw-extrabold font-monospace text-primary fs-5">₹{formatINR(invoiceForm.totalAmount)}</span>
                        </div>
                         {(() => {
                          const expectedBalance = parseFloat((invoiceForm.totalAmount - (invoiceForm.paidAmount || 0)).toFixed(2));
                          const actualBalance = parseFloat((invoiceForm.balanceDue || 0).toFixed(2));
                          let labelText = "BALANCE DUE:";
                          let textClass = "text-danger";
                          if (actualBalance < expectedBalance) {
                            labelText = "BALANCE DUE (CREDITED):";
                            textClass = "text-danger";
                          } else if (actualBalance > expectedBalance) {
                            labelText = "BALANCE DUE (DEBITED):";
                            textClass = "text-success";
                          }
                          return (
                            <div className={`d-flex justify-content-between ${textClass}`}>
                              <span className="font-monospace fw-bold">{labelText}</span>
                              <span className="fw-extrabold font-monospace fs-5">₹{formatINR(invoiceForm.balanceDue)}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Calculations & Notes row */}
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Total Amount in Words</label>
                      <input
                        type="text"
                        className="form-control fw-bold font-monospace"
                        value={invoiceForm.totalAmountWords}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, totalAmountWords: e.target.value })}
                        placeholder="One Lakh Seventy One Thousand Rupees Only"
                      />
                    </div>
                    
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Remarks / Internal Notes (Optional)</label>
                      <textarea
                        className="form-control"
                        rows="2"
                        placeholder="Provide details not displayed on final printed invoice..."
                        value={invoiceForm.notes}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                      ></textarea>
                    </div>

                    <div className="col-12">
                      <label className="form-label font-monospace text-secondary small fw-bold">Terms & Conditions</label>
                      <textarea
                        className="form-control font-monospace small"
                        rows="5"
                        value={invoiceForm.terms}
                        onChange={(e) => setInvoiceForm({ ...invoiceForm, terms: e.target.value })}
                        placeholder="Standard contract terms..."
                      ></textarea>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top border-secondary-subtle">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={() => setViewState("list")}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary px-5"
                    >
                      {viewState === "add" ? "Create Invoice" : "Save Changes"}
                    </button>
                  </div>

                </form>
              </div>
            </div>
          )}

          {/* PREVIEW & PRINT LAYOUT VIEW */}
          {viewState === "preview" && (
            <div className="d-flex flex-column align-items-center bg-dark bg-opacity-10 py-4 overflow-auto rounded-3">
              
              {/* Paper Layout (Page 1) */}
              <div className="invoice-paper-preview invoice-page mb-5 shadow" id="invoice-page-1">
                {/* Header Title */}
                <div className="text-center mb-4">
                  <h1 className="fw-extrabold text-uppercase m-0" style={{ fontSize: "2.1rem", letterSpacing: "3px" }}>Invoice</h1>
                </div>

                {/* Beats Production Corporate Details */}
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div style={{ maxWidth: "60%" }}>
                    <h2 className="fw-bold m-0" style={{ fontSize: "1.4rem", color: "#111" }}>Beats Production Private Limited</h2>
                    <div className="text-secondary mt-2 small" style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                      No 204, Laxminarayana Complex,<br />
                      Bilekahalli, Bengaluru, Karnataka, 560076<br />
                      PAN : AAMCB8470E. TAN : BLRB28005F. SAC Code: 998596 HSN Code: 997319<br />
                      Mobile: +918050641361<br />
                      Telephone: +918050402447<br />
                      Email: accounts@beatsproduction.in<br />
                      beatsproduction.in<br />
                      GST: 29AAMCB8470E1ZB
                    </div>
                  </div>

                <div className="d-flex flex-column align-items-center">
  <img
    src={beatslogo}
    alt="Beats Production"
    style={{
      width: "120px",
      height: "120px",
      objectFit: "contain"
    }}
  />
</div>
                </div>

                <hr style={{ borderTop: "2px solid #111", margin: "15px 0" }} />

                {/* Bill To vs Invoice Metadata */}
                <div className="row mb-4">
                  {/* Bill To */}
                  <div className="col-7">
                    <h3 className="fw-bold mb-2" style={{ fontSize: "1rem" }}>Bill To</h3>
                    <div style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                      {invoiceForm.companyName ? (
                        <>
                          <strong className="d-block mb-0" style={{ fontSize: "1rem" }}>{invoiceForm.companyName}</strong>
                          {invoiceForm.clientName && <span className="text-secondary small d-block mb-1">Attn: {invoiceForm.clientName}</span>}
                        </>
                      ) : (
                        <strong className="d-block mb-1">{invoiceForm.clientName}</strong>
                      )}
                      <div style={{ whiteSpace: "pre-wrap", color: "#333" }}>{invoiceForm.clientAddress}</div>
                      {invoiceForm.clientGst && (
                        <div className="mt-1">
                          <strong>GSTIN:</strong> {invoiceForm.clientGst}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Invoice Details */}
                  <div className="col-5 text-end">
                    <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
                      <div className="d-flex justify-content-end align-items-center">
                        <span className="text-secondary me-2 fw-bold" style={{ fontSize: "1rem" }}>Invoice No :</span>
                        <strong style={{ fontSize: "1.2rem", fontFamily: "monospace" }}>{invoiceForm.invoiceNumber}</strong>
                      </div>
                      <div className="d-flex justify-content-end">
                        <span className="text-secondary me-2">Invoice Date :</span>
                        <span>{formatDateShort(invoiceForm.invoiceDate)}</span>
                      </div>
                      <div className="d-flex justify-content-end">
                        <span className="text-secondary me-2">Event Date :</span>
                        <span>{invoiceForm.eventDate || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="table-responsive border border-secondary border-opacity-25 rounded-0 mb-2" style={{ overflow: "hidden" }}>
                  <table className="table mb-0 align-middle">
                    <thead>
                      <tr>
                        <th className="pdf-table-header text-center" style={{ width: "6%" }}>Sl.</th>
                        <th className="pdf-table-header" style={{ width: "54%" }}>Description</th>
                        <th className="pdf-table-header text-center" style={{ width: "10%" }}>Qty</th>
                        <th className="pdf-table-header text-end" style={{ width: "15%" }}>Rate</th>
                        <th className="pdf-table-header text-end" style={{ width: "15%" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceForm.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
                          <td className="text-center font-monospace" style={{ fontSize: "0.85rem" }}>{idx + 1}</td>
                          <td style={{ fontSize: "0.85rem" }}>{item.description}</td>
                          <td className="text-center font-monospace" style={{ fontSize: "0.85rem" }}>{item.quantity}</td>
                          <td className="text-end font-monospace" style={{ fontSize: "0.85rem" }}>{formatINR(item.rate)}</td>
                          <td className="text-end font-monospace" style={{ fontSize: "0.85rem" }}>{formatINR(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bottom calculations & notes layout */}
                <div className="row g-3" style={{ fontSize: "0.85rem" }}>
                  {/* Left Column: Bank details */}
                  <div className="col-7">
                    <h4 className="fw-bold mb-2" style={{ fontSize: "0.9rem" }}>Payment Instructions</h4>
                    <div className="mb-3 text-secondary" style={{ lineHeight: "1.3" }}>
                      Pay Check to:<br />
                      <strong>{invoiceForm.bankAccountName}</strong>
                    </div>
                    
                    <div className="text-secondary" style={{ lineHeight: "1.4" }}>
                      Send to bank:<br />
                      <strong>Account Name :</strong> {invoiceForm.bankAccountName}<br />
                      <strong>Account No :</strong> {invoiceForm.bankAccountNumber}<br />
                      <strong>IFSC Code :</strong> {invoiceForm.bankIfsc}<br />
                      <strong>Bank Name :</strong> {invoiceForm.bankName}
                    </div>
                  </div>

                  {/* Right Column: Calculations */}
                  <div className="col-5">
                    <table className="w-100 align-middle" style={{ borderCollapse: "collapse", lineHeight: "1.6" }}>
                      <tbody>
                        <tr>
                          <td>Subtotal</td>
                          <td className="text-end font-monospace">₹ {formatINR(invoiceForm.subtotal)}</td>
                        </tr>
                        <tr>
                          <td>CGST ({invoiceForm.cgstRate}%)</td>
                          <td className="text-end font-monospace">₹ {formatINR(invoiceForm.cgstAmount)}</td>
                        </tr>
                        <tr style={{ borderBottom: "1px solid #aaa" }}>
                          <td className="pb-1">SGST ({invoiceForm.sgstRate}%)</td>
                          <td className="text-end font-monospace pb-1">₹ {formatINR(invoiceForm.sgstAmount)}</td>
                        </tr>
                        <tr className="fw-extrabold" style={{ fontSize: "0.95rem" }}>
                          <td className="pt-2">Total</td>
                          <td className="text-end font-monospace pt-2">₹ {formatINR(invoiceForm.totalAmount)}</td>
                        </tr>
                        {invoiceForm.paidAmount > 0 && (
                          <tr className="text-muted">
                            <td>
                              Paid {invoiceForm.paidDate ? `on ${invoiceForm.paidDate}` : ""}
                            </td>
                            <td className="text-end font-monospace">₹ {formatINR(invoiceForm.paidAmount)}</td>
                          </tr>
                        )}
                        {(() => {
                          const expectedBalance = parseFloat((invoiceForm.totalAmount - (invoiceForm.paidAmount || 0)).toFixed(2));
                          const actualBalance = parseFloat((invoiceForm.balanceDue || 0).toFixed(2));
                          if (actualBalance < expectedBalance) {
                            return (
                              <tr className="fw-extrabold border-top border-dark text-danger" style={{ fontSize: "0.95rem" }}>
                                <td className="pt-1">Balance Due (Credited)</td>
                                <td className="text-end font-monospace pt-1">₹ {formatINR(invoiceForm.balanceDue)}</td>
                              </tr>
                            );
                          } else if (actualBalance > expectedBalance) {
                            return (
                              <tr className="fw-extrabold border-top border-dark text-success" style={{ fontSize: "0.95rem" }}>
                                <td className="pt-1">Balance Due (Debited)</td>
                                <td className="text-end font-monospace pt-1">₹ {formatINR(invoiceForm.balanceDue)}</td>
                              </tr>
                            );
                          } else {
                            return (
                              <tr className="fw-extrabold border-top border-dark" style={{ fontSize: "0.95rem" }}>
                                <td className="pt-1">Balance Due</td>
                                <td className="text-end font-monospace pt-1">₹ {formatINR(invoiceForm.balanceDue)}</td>
                              </tr>
                            );
                          }
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Amount in words */}
                <div className="mt-4" style={{ fontSize: "0.85rem" }}>
                  <strong>Total Amount (in words) :</strong><br />
                  <span className="fw-bold mt-1 d-block text-secondary">{invoiceForm.totalAmountWords}</span>
                </div>
              </div>

              {/* Paper Layout (Page 2) */}
              <div className="invoice-paper-preview invoice-page shadow" id="invoice-page-2">
                <div style={{ minHeight: "80%" }}>
                  {/* Terms and conditions */}
                  <div className="mb-4" style={{ fontSize: "0.75rem", color: "#444", textAlign: "justify" }}>
                    <strong className="d-block mb-2 text-dark">Terms</strong>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.3" }}>
                      {invoiceForm.terms}
                    </div>
                  </div>

                  {/* Agree details */}
                  <div className="border border-secondary border-opacity-25 p-3 rounded-1 mb-5" style={{ fontSize: "0.85rem", color: "#333", backgroundColor: "#f9f9f9" }}>
                    By signing this document, the customer agrees to the services and conditions described in this document.
                  </div>

                  {/* Signatures Row */}
                  <div className="d-flex justify-content-between align-items-end mt-5 pt-5" style={{ padding: "0 10px" }}>
                    {/* Beats Signatory */}
                    <div className="text-center" style={{ width: "40%" }}>
                      <div className="mb-2 d-flex justify-content-center" style={{ height: "70px" }}>
                        {/* High fidelity cursive SVG signature */}
                        <svg width="150" height="70" viewBox="0 0 150 70" xmlns="http://www.w3.org/2000/svg">
                          <path d="M 10 45 Q 25 15, 35 25 T 55 10 T 65 35 T 80 20 T 95 40 T 115 15 T 135 30" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M 20 40 L 130 35" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div style={{ borderTop: "1px solid #111", paddingTop: "5px", fontSize: "0.85rem" }}>
                        <strong>For Beats Production Private Limited</strong>
                      </div>
                    </div>

                    {/* Client Signatory */}
                    <div className="text-center" style={{ width: "40%" }}>
                      <div className="mb-2" style={{ height: "70px" }}></div>
                      <div style={{ borderTop: "1px solid #111", paddingTop: "5px", fontSize: "0.85rem" }}>
                        <strong>Client Signatory</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Raw Print Component Wrapper (Only activated during browser print command) */}
      <div className="print-area-wrapper d-none">
        
        {/* Page 1 */}
        <div className="invoice-page">
          {/* Header Title */}
          <div className="text-center mb-4">
            <h1 className="fw-extrabold text-uppercase m-0" style={{ fontSize: "2.1rem", letterSpacing: "3px" }}>Invoice</h1>
          </div>

          {/* Beats Production Corporate Details */}
          <div className="d-flex justify-content-between align-items-start mb-4">
            <div style={{ maxWidth: "60%" }}>
              <h2 className="fw-bold m-0" style={{ fontSize: "1.4rem", color: "#111" }}>Beats Production Private Limited</h2>
              <div className="text-secondary mt-2 small" style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                No 204, Laxminarayana Complex,<br />
                Bilekahalli, Bengaluru, Karnataka, 560076<br />
                PAN : AAMCB8470E. TAN : BLRB28005F. SAC Code: 998596 HSN Code: 997319<br />
                Mobile: +918050641361<br />
                Telephone: +918050402447<br />
                Email: accounts@beatsproduction.in<br />
                beatsproduction.in<br />
                GST: 29AAMCB8470E1ZB
              </div>
            </div>

            {/* Logo */}
            <div className="d-flex flex-column align-items-center">
              <img
                src={beatslogo}
                alt="Beats Production"
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "contain"
                }}
              />
            </div>
          </div>

          <hr style={{ borderTop: "2px solid #111", margin: "15px 0" }} />

          {/* Bill To vs Invoice Metadata */}
          <div className="row mb-4">
            <div className="col-7">
              <h3 className="fw-bold mb-2" style={{ fontSize: "1rem" }}>Bill To</h3>
              <div style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                <strong className="d-block mb-1">{invoiceForm.clientName}</strong>
                <div style={{ whiteSpace: "pre-wrap", color: "#333" }}>{invoiceForm.clientAddress}</div>
                {invoiceForm.clientGst && (
                  <div className="mt-1">
                    <strong>GSTIN:</strong> {invoiceForm.clientGst}
                  </div>
                )}
              </div>
            </div>

            <div className="col-5 text-end">
              <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
                <div className="d-flex justify-content-end align-items-center">
                  <span className="text-secondary me-2 fw-bold" style={{ fontSize: "1rem" }}>Invoice No :</span>
                  <strong style={{ fontSize: "1.2rem", fontFamily: "monospace" }}>{invoiceForm.invoiceNumber}</strong>
                </div>
                <div className="d-flex justify-content-end">
                  <span className="text-secondary me-2">Invoice Date :</span>
                  <span>{formatDateShort(invoiceForm.invoiceDate)}</span>
                </div>
                <div className="d-flex justify-content-end">
                  <span className="text-secondary me-2">Event Date :</span>
                  <span>{invoiceForm.eventDate || "-"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="border border-secondary border-opacity-25 mb-2" style={{ overflow: "hidden" }}>
            <table className="table mb-0 align-middle">
              <thead>
                <tr>
                  <th style={{ backgroundColor: "#0066d4", color: "#ffffff", fontWeight: "bold", width: "6%" }} className="text-center">Sl.</th>
                  <th style={{ backgroundColor: "#0066d4", color: "#ffffff", fontWeight: "bold", width: "54%" }}>Description</th>
                  <th style={{ backgroundColor: "#0066d4", color: "#ffffff", fontWeight: "bold", width: "10%" }} className="text-center">Qty</th>
                  <th style={{ backgroundColor: "#0066d4", color: "#ffffff", fontWeight: "bold", width: "15%" }} className="text-end">Rate</th>
                  <th style={{ backgroundColor: "#0066d4", color: "#ffffff", fontWeight: "bold", width: "15%" }} className="text-end">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoiceForm.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
                    <td className="text-center font-monospace" style={{ fontSize: "0.85rem" }}>{idx + 1}</td>
                    <td style={{ fontSize: "0.85rem" }}>{item.description}</td>
                    <td className="text-center font-monospace" style={{ fontSize: "0.85rem" }}>{item.quantity}</td>
                    <td className="text-end font-monospace" style={{ fontSize: "0.85rem" }}>{formatINR(item.rate)}</td>
                    <td className="text-end font-monospace" style={{ fontSize: "0.85rem" }}>{formatINR(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations & Bank instructions */}
          <div className="row g-3" style={{ fontSize: "0.85rem" }}>
            <div className="col-7">
              <h4 className="fw-bold mb-2" style={{ fontSize: "0.9rem" }}>Payment Instructions</h4>
              <div className="mb-3 text-secondary" style={{ lineHeight: "1.3" }}>
                Pay Check to:<br />
                <strong>{invoiceForm.bankAccountName}</strong>
              </div>
              
              <div className="text-secondary" style={{ lineHeight: "1.4" }}>
                Send to bank:<br />
                <strong>Account Name :</strong> {invoiceForm.bankAccountName}<br />
                <strong>Account No :</strong> {invoiceForm.bankAccountNumber}<br />
                <strong>IFSC Code :</strong> {invoiceForm.bankIfsc}<br />
                <strong>Bank Name :</strong> {invoiceForm.bankName}
              </div>
            </div>

            <div className="col-5">
              <table className="w-100 align-middle" style={{ borderCollapse: "collapse", lineHeight: "1.6" }}>
                <tbody>
                  <tr>
                    <td>Subtotal</td>
                    <td className="text-end font-monospace">₹ {formatINR(invoiceForm.subtotal)}</td>
                  </tr>
                  <tr>
                    <td>CGST ({invoiceForm.cgstRate}%)</td>
                    <td className="text-end font-monospace">₹ {formatINR(invoiceForm.cgstAmount)}</td>
                  </tr>
                  <tr style={{ borderBottom: "1px solid #aaa" }}>
                    <td className="pb-1">SGST ({invoiceForm.sgstRate}%)</td>
                    <td className="text-end font-monospace pb-1">₹ {formatINR(invoiceForm.sgstAmount)}</td>
                  </tr>
                  <tr className="fw-extrabold" style={{ fontSize: "0.95rem" }}>
                    <td className="pt-2">Total</td>
                    <td className="text-end font-monospace pt-2">₹ {formatINR(invoiceForm.totalAmount)}</td>
                  </tr>
                  {invoiceForm.paidAmount > 0 && (
                    <tr className="text-muted">
                      <td>
                        Paid {invoiceForm.paidDate ? `on ${invoiceForm.paidDate}` : ""}
                      </td>
                      <td className="text-end font-monospace">₹ {formatINR(invoiceForm.paidAmount)}</td>
                    </tr>
                  )}
                  <tr className="fw-extrabold border-top border-dark" style={{ fontSize: "0.95rem" }}>
                    <td className="pt-1">Balance Due</td>
                    <td className="text-end font-monospace pt-1">₹ {formatINR(invoiceForm.balanceDue)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount words */}
          <div className="mt-4" style={{ fontSize: "0.85rem" }}>
            <strong>Total Amount (in words) :</strong><br />
            <span className="fw-bold mt-1 d-block text-secondary">{invoiceForm.totalAmountWords}</span>
          </div>




        </div>

        {/* Page 2 */}
        <div className="invoice-page">
          <div style={{ minHeight: "80%" }}>
            {/* Terms & Conditions */}
            <div className="mb-4" style={{ fontSize: "0.75rem", color: "#444", textAlign: "justify" }}>
              <strong className="d-block mb-2 text-dark">Terms</strong>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.3" }}>
                {invoiceForm.terms}
              </div>
            </div>

            <div className="border border-secondary border-opacity-25 p-3 rounded-1 mb-5" style={{ fontSize: "0.85rem", color: "#333", backgroundColor: "#f9f9f9" }}>
              By signing this document, the customer agrees to the services and conditions described in this document.
            </div>

            <div className="d-flex justify-content-between align-items-end mt-5 pt-5" style={{ padding: "0 10px" }}>
              {/* Beats Signatory */}
              <div className="text-center" style={{ width: "40%" }}>
                <div className="mb-2 d-flex justify-content-center" style={{ height: "70px" }}>
                  <svg width="150" height="70" viewBox="0 0 150 70" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 10 45 Q 25 15, 35 25 T 55 10 T 65 35 T 80 20 T 95 40 T 115 15 T 135 30" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M 20 40 L 130 35" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
                <div style={{ borderTop: "1px solid #111", paddingTop: "5px", fontSize: "0.85rem" }}>
                  <strong>For Beats Production Private Limited</strong>
                </div>
              </div>

              {/* Client Signatory */}
              <div className="text-center" style={{ width: "40%" }}>
                <div className="mb-2" style={{ height: "70px" }}></div>
                <div style={{ borderTop: "1px solid #111", paddingTop: "5px", fontSize: "0.85rem" }}>
                  <strong>Client Signatory</strong>
                </div>
              </div>
            </div>
          </div>


        </div>

      </div>

    </div>
  );
}

export default AdminInvoices;
