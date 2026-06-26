import { useState, useEffect } from "react";
import { getCreditNotes, createCreditNote, deleteCreditNote, getInvoices } from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import beatslogo from "../assets/beats-logo.jpg";

const DEFAULT_TERMS = `a) All credit adjustments are subject to verification and approval.
b) Approved credit values will be automatically deducted from the balance due of the designated Tax Invoice.
c) Any query regarding this credit note must be submitted in writing within 24 hours of issuance.`;

function numberToWordsINR(num) {
  if (num === 0) return "Zero Rupees Only";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const g = ["", "Thousand", "Lakh", "Crore"];
  const parts = parseFloat(num).toFixed(2).split(".");
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
  const crore = Math.floor(temp / 10000000); temp %= 10000000;
  if (crore > 0) res += helper(crore) + "Crore ";
  const lakh = Math.floor(temp / 100000); temp %= 100000;
  if (lakh > 0) res += helper(lakh) + "Lakh ";
  const thousand = Math.floor(temp / 1000); temp %= 1000;
  if (thousand > 0) res += helper(thousand) + "Thousand ";
  if (temp > 0) res += helper(temp);
  res = res.trim() + " Rupees";
  if (decimalPart > 0) res += " and " + helper(decimalPart).trim() + " Paise";
  return res + " Only";
}

function formatDateShort(dateStr) {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day} ${months[date.getMonth()]} , ${date.getFullYear()}`;
  } catch (e) { return dateStr; }
}

function formatINR(amount) {
  if (amount === undefined || amount === null) return "0.00";
  const num = parseFloat(amount);
  if (isNaN(num)) return "0.00";
  const parts = num.toFixed(2).split(".");
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherDigits = parts[0].substring(0, parts[0].length - 3);
  if (otherDigits !== "") lastThree = "," + lastThree;
  return otherDigits.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + "." + parts[1];
}

function AdminCreditNotes() {
  const [creditNotes, setCreditNotes] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState("list");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [creditNoteForm, setCreditNoteForm] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    eventDate: "",
    clientName: "",
    companyName: "",
    clientAddress: "",
    clientGst: "",
    clientEmail: "",
    invoiceId: "",
    parentInvoiceNumber: "",
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
    status: "Draft"
  });

  useEffect(() => {
    loadCreditNotes();
    loadInvoices();
  }, []);

  const loadCreditNotes = async () => {
    setLoading(true);
    try {
      const res = await getCreditNotes();
      setCreditNotes(res.data.reverse());
    } catch (e) { console.error("Error loading credit notes:", e); }
    finally { setLoading(false); }
  };

  const loadInvoices = async () => {
    try {
      const res = await getInvoices();
      setInvoices(res.data);
    } catch (e) { console.error("Error loading parent invoices:", e); }
  };

  const generateCreditNoteNumber = () => {
    const year = new Date().getFullYear();
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    return `CN-${year}-${randomSuffix}`;
  };

  const handleOpenAddForm = () => {
    setCreditNoteForm({
      invoiceNumber: generateCreditNoteNumber(),
      invoiceDate: new Date().toISOString().split("T")[0],
      eventDate: "",
      clientName: "",
      companyName: "",
      clientAddress: "",
      clientGst: "",
      clientEmail: "",
      invoiceId: "",
      parentInvoiceNumber: "",
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
      status: "Draft"
    });
    setErrorMsg("");
    setSuccessMsg("");
    setViewState("add");
  };

  const handleOpenPreview = (note) => {
    setCreditNoteForm({
      ...note,
      companyName: note.companyName || ""
    });
    setViewState("preview");
  };

  const handleInvoiceSelect = (invoiceId) => {
    const selectedInvoice = invoices.find(inv => inv._id === invoiceId);
    if (!selectedInvoice) return;
    
    const itemsCopy = selectedInvoice.items.map(item => ({ ...item }));
    const calc = recalculateAmounts(itemsCopy, selectedInvoice.cgstRate || 9, selectedInvoice.sgstRate || 9, 0);

    setCreditNoteForm({
      ...creditNoteForm,
      invoiceId: selectedInvoice._id,
      parentInvoiceNumber: selectedInvoice.invoiceNumber,
      clientName: selectedInvoice.clientName,
      companyName: selectedInvoice.companyName || "",
      clientAddress: selectedInvoice.clientAddress || "",
      clientGst: selectedInvoice.clientGst || "",
      clientEmail: selectedInvoice.clientEmail || "",
      eventDate: selectedInvoice.eventDate || "",
      items: itemsCopy,
      cgstRate: selectedInvoice.cgstRate || 9,
      sgstRate: selectedInvoice.sgstRate || 9,
      ...calc
    });
  };

  const recalculateAmounts = (items, cgstRate, sgstRate, paidAmount) => {
    const sub = items.reduce((sum, item) => sum + (item.amount || 0), 0);
    const cgst = parseFloat((sub * (cgstRate / 100)).toFixed(2));
    const sgst = parseFloat((sub * (sgstRate / 100)).toFixed(2));
    const total = parseFloat((sub + cgst + sgst).toFixed(2));
    const bal = parseFloat((total - paidAmount).toFixed(2));
    const words = numberToWordsINR(total);
    return { subtotal: sub, cgstAmount: cgst, sgstAmount: sgst, totalAmount: total, balanceDue: bal, totalAmountWords: words };
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...creditNoteForm.items];
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
    const calc = recalculateAmounts(updatedItems, creditNoteForm.cgstRate, creditNoteForm.sgstRate, creditNoteForm.paidAmount);
    setCreditNoteForm({ ...creditNoteForm, items: updatedItems, ...calc });
  };

  const handleAddItemRow = () => {
    const updatedItems = [...creditNoteForm.items, { description: "", quantity: 1, rate: 0, amount: 0 }];
    const calc = recalculateAmounts(updatedItems, creditNoteForm.cgstRate, creditNoteForm.sgstRate, creditNoteForm.paidAmount);
    setCreditNoteForm({ ...creditNoteForm, items: updatedItems, ...calc });
  };

  const handleRemoveItemRow = (index) => {
    if (creditNoteForm.items.length === 1) return;
    const updatedItems = creditNoteForm.items.filter((_, idx) => idx !== index);
    const calc = recalculateAmounts(updatedItems, creditNoteForm.cgstRate, creditNoteForm.sgstRate, creditNoteForm.paidAmount);
    setCreditNoteForm({ ...creditNoteForm, items: updatedItems, ...calc });
  };

  const handleFinancialFieldChange = (field, value) => {
    const updatedForm = { ...creditNoteForm, [field]: parseFloat(value) || 0 };
    const calc = recalculateAmounts(updatedForm.items, updatedForm.cgstRate, updatedForm.sgstRate, updatedForm.paidAmount);
    setCreditNoteForm({ ...updatedForm, ...calc });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!creditNoteForm.invoiceId) { setErrorMsg("Please select a parent invoice."); return; }
    if (!creditNoteForm.invoiceNumber.trim()) { setErrorMsg("Credit Note number is required."); return; }
    try {
      await createCreditNote(creditNoteForm);
      setSuccessMsg("Credit Note created successfully and parent Invoice balance adjusted!");
      setTimeout(() => { setViewState("list"); loadCreditNotes(); }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "An error occurred saving the credit note.");
    }
  };

  const handleDeleteCreditNote = async (id) => {
    if (window.confirm("Delete this Credit Note? This will restore the parent Invoice balance.")) {
      try {
        await deleteCreditNote(id);
        loadCreditNotes();
      } catch (err) { alert(err.response?.data?.detail || "Failed to delete Credit Note"); }
    }
  };

  const handleDownloadPDF = () => {
    const page1 = document.getElementById("invoice-page-1");
    const page2 = document.getElementById("invoice-page-2");
    if (!page1 || !page2) return;
    const element = document.createElement("div");
    element.style.background = "#ffffff";
    element.style.color = "#000000";
    element.style.fontFamily = "Arial, sans-serif";
    element.style.width = "210mm";
    const p1 = page1.cloneNode(true);
    p1.style.boxShadow = "none"; p1.style.border = "none"; p1.style.margin = "0"; p1.style.padding = "20mm 15mm";
    p1.style.height = "auto"; p1.style.minHeight = "0"; p1.style.overflow = "visible"; p1.style.position = "relative";
    element.appendChild(p1);
    const p2 = page2.cloneNode(true);
    p2.style.boxShadow = "none"; p2.style.border = "none"; p2.style.margin = "0"; p2.style.padding = "20mm 15mm";
    p2.style.height = "auto"; p2.style.minHeight = "0"; p2.style.overflow = "visible"; p2.style.position = "relative";
    p2.style.pageBreakBefore = "always";
    element.appendChild(p2);
    const runHtml2Pdf = () => {
      const opt = {
        margin: 0,
        filename: `${creditNoteForm.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2.5, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      window.html2pdf().from(element).set(opt).save();
    };
    if (window.html2pdf) runHtml2Pdf();
    else {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = runHtml2Pdf;
      document.body.appendChild(script);
    }
  };

  return (
    <div className="d-flex flex-column vh-100">
      <style>{`
        @media print {
          .d-flex.flex-column.vh-100, .sidebar-container, .navbar, .btn, .alert, .preview-toolbar, p.text-muted, h2 { display: none !important; }
          body, html { background: #ffffff !important; color: #000000 !important; margin: 0 !important; padding: 0 !important; font-family: Arial, sans-serif !important; }
          .print-area-wrapper { display: block !important; width: 100% !important; margin: 0 !important; padding: 0 !important; }
          .invoice-page { width: 210mm !important; height: 296mm !important; padding: 20mm 15mm !important; margin: 0 auto !important; box-sizing: border-box !important; page-break-after: always !important; position: relative !important; background: #ffffff !important; overflow: hidden !important; }
          .invoice-page:last-child { page-break-after: avoid !important; }
        }
        .invoice-paper-preview { background-color: #ffffff; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15); border: 1px solid #ddd; width: 210mm; min-height: 297mm; padding: 20mm 15mm; margin: 0 auto 30px auto; box-sizing: border-box; position: relative; color: #111; font-family: Arial, Helvetica, sans-serif; }
        .pdf-table-header { background-color: #0066d4 !important; color: #ffffff !important; font-weight: bold; text-align: left; }
        .invoice-page .table td, .invoice-page .table th { padding: 6px 10px !important; font-size: 0.8rem !important; }
        .invoice-page hr { margin: 10px 0 !important; }
      `}</style>
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <div className="flex-grow-1 p-4 fade-in" style={{ overflowY: "auto" }}>
          
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-extrabold m-0" style={{ letterSpacing: "-1px" }}>
                {viewState === "list" && "Credit Note Management"}
                {viewState === "add" && "Create Credit Note"}
                {viewState === "preview" && "Credit Note Print Preview"}
              </h2>
              <p className="text-muted small m-0 mt-1">
                {viewState === "list" && "Create credit notes to adjust Tax Invoice balances"}
                {viewState === "preview" && "Emulated PDF layout view. Ready for print output."}
              </p>
            </div>
            <div className="d-flex gap-2">
              {viewState === "list" && (
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddForm}>
                  <span>➕</span> Create Credit Note
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

          {viewState === "list" ? (
            <div className="card shadow-sm p-3 border-0">
              {loading ? (
                <div className="text-center my-5 py-5">
                  <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
              ) : (
                <div className="table-responsive border-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Credit Note No.</th>
                        <th>Parent Invoice</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Amount Credited</th>
                        <th>Status</th>
                        <th className="text-center" style={{ width: "200px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditNotes.map((note) => (
                        <tr key={note._id}>
                          <td><strong className="text-primary font-monospace">{note.invoiceNumber}</strong></td>
                          <td><span className="badge bg-light text-secondary border font-monospace">{note.parentInvoiceNumber}</span></td>
                          <td><span className="fw-bold text-dark">{note.clientName}</span></td>
                          <td className="font-monospace text-secondary">{formatDateShort(note.invoiceDate)}</td>
                          <td><span className="fw-extrabold text-danger font-monospace">₹{formatINR(note.totalAmount)}</span></td>
                          <td><span className="bg-success text-white px-3 py-2 rounded-3 small fw-bold font-monospace">Issued</span></td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-info text-white me-2 px-2 fw-bold" onClick={() => handleOpenPreview(note)}>Preview</button>
                            <button className="btn btn-sm btn-danger px-2" onClick={() => handleDeleteCreditNote(note._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (viewState === "add") ? (
            <div className="card shadow-sm border-0 fade-in">
              <div className="card-header card-gradient-blue p-4 border-0">
                <h5 className="mb-0 fw-bold">Credit Note Form</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">Select Tax Invoice</label>
                      <select className="form-select" required value={creditNoteForm.invoiceId} onChange={(e) => handleInvoiceSelect(e.target.value)}>
                        <option value="">-- Choose parent Invoice --</option>
                        {invoices.map(inv => (
                          <option key={inv._id} value={inv._id}>
                            {inv.invoiceNumber} ({inv.clientName} - Total: ₹{formatINR(inv.totalAmount)})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">Credit Note Number</label>
                      <input type="text" className="form-control font-monospace fw-bold" required value={creditNoteForm.invoiceNumber} onChange={(e) => setCreditNoteForm({ ...creditNoteForm, invoiceNumber: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">Credit Note Date</label>
                      <input type="date" className="form-control" required value={creditNoteForm.invoiceDate} onChange={(e) => setCreditNoteForm({ ...creditNoteForm, invoiceDate: e.target.value })} />
                    </div>
                  </div>

                  {creditNoteForm.invoiceId && (
                    <>
                      <h5 className="fw-bold mb-3">Adjust Line Items (Amounts to credit)</h5>
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
                            {creditNoteForm.items.map((item, idx) => (
                              <tr key={idx}>
                                <td><input type="text" className="form-control" required value={item.description} onChange={(e) => handleItemChange(idx, "description", e.target.value)} /></td>
                                <td><input type="number" className="form-control text-center font-monospace" required min="0.01" step="any" value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", e.target.value)} /></td>
                                <td><input type="number" className="form-control text-end font-monospace" required min="0.00" step="any" value={item.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} /></td>
                                <td className="text-end font-monospace fw-bold text-secondary">₹{formatINR(item.amount)}</td>
                                <td className="text-center">
                                  <button type="button" className="btn btn-sm btn-outline-danger" disabled={creditNoteForm.items.length === 1} onClick={() => handleRemoveItemRow(idx)}>🗑️</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="d-flex justify-content-end mb-4">
                        <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddItemRow}>➕ Add Item Row</button>
                      </div>
                      
                      <div className="row g-4 mb-4">
                        <div className="col-12 col-md-6">
                          <div className="row g-3">
                            <div className="col-6">
                              <label className="form-label font-monospace text-secondary small fw-bold">CGST Rate (%)</label>
                              <input type="number" className="form-control font-monospace" value={creditNoteForm.cgstRate} onChange={(e) => handleFinancialFieldChange("cgstRate", e.target.value)} />
                            </div>
                            <div className="col-6">
                              <label className="form-label font-monospace text-secondary small fw-bold">SGST Rate (%)</label>
                              <input type="number" className="form-control font-monospace" value={creditNoteForm.sgstRate} onChange={(e) => handleFinancialFieldChange("sgstRate", e.target.value)} />
                            </div>
                          </div>
                        </div>
                        <div className="col-12 col-md-6">
                          <div className="card bg-light border-0 p-3 shadow-sm text-end">
                            <div className="d-flex justify-content-between mb-2"><span>Subtotal Credit:</span><span className="fw-bold font-monospace">₹{formatINR(creditNoteForm.subtotal)}</span></div>
                            <div className="d-flex justify-content-between mb-2"><span>CGST ({creditNoteForm.cgstRate}%):</span><span className="fw-bold font-monospace">₹{formatINR(creditNoteForm.cgstAmount)}</span></div>
                            <div className="d-flex justify-content-between mb-2"><span>SGST ({creditNoteForm.sgstRate}%):</span><span className="fw-bold font-monospace">₹{formatINR(creditNoteForm.sgstAmount)}</span></div>
                            <hr className="my-2" />
                            <div className="d-flex justify-content-between mb-2"><span className="fw-bold text-danger">TOTAL CREDIT VALUE:</span><span className="fw-extrabold font-monospace text-danger fs-5">₹{formatINR(creditNoteForm.totalAmount)}</span></div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="row g-3">
                        <div className="col-12 col-md-6">
                          <label className="form-label font-monospace text-secondary small fw-bold">Total in Words</label>
                          <input type="text" className="form-control fw-bold font-monospace" value={creditNoteForm.totalAmountWords} onChange={(e) => setCreditNoteForm({ ...creditNoteForm, totalAmountWords: e.target.value })} />
                        </div>
                        <div className="col-12 col-md-6">
                          <label className="form-label font-monospace text-secondary small fw-bold">Reason for credit (Notes)</label>
                          <textarea className="form-control" rows="2" value={creditNoteForm.notes} onChange={(e) => setCreditNoteForm({ ...creditNoteForm, notes: e.target.value })} />
                        </div>
                        <div className="col-12">
                          <label className="form-label font-monospace text-secondary small fw-bold">Terms &amp; Conditions</label>
                          <textarea className="form-control font-monospace small" rows="3" value={creditNoteForm.terms} onChange={(e) => setCreditNoteForm({ ...creditNoteForm, terms: e.target.value })} />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setViewState("list")}>Cancel</button>
                    <button type="submit" className="btn btn-danger px-5" disabled={!creditNoteForm.invoiceId}>Issue Credit Note</button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* PREVIEW LAYOUT VIEW */
            <div className="d-flex flex-column align-items-center bg-dark bg-opacity-10 py-4 overflow-auto rounded-3">
              <div className="invoice-paper-preview invoice-page mb-5 shadow" id="invoice-page-1">
                <div className="text-center mb-4">
                  <h1 className="fw-extrabold text-uppercase m-0" style={{ fontSize: "2.1rem", letterSpacing: "3px" }}>Credit Note</h1>
                </div>
                <div className="d-flex justify-content-between align-items-start mb-4">
                  <div style={{ maxWidth: "60%" }}>
                    <h2 className="fw-bold m-0" style={{ fontSize: "1.4rem", color: "#111" }}>Beats Production Private Limited</h2>
                    <div className="text-secondary mt-2 small" style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                      No 204, Laxminarayana Complex, Bilekahalli, Bengaluru, Karnataka, 560076<br />
                      PAN : AAMCB8470E. TAN : BLRB28005F. SAC Code: 998596 HSN Code: 997319<br />
                      Mobile: +918050641361 | Email: accounts@beatsproduction.in<br />
                      GST: 29AAMCB8470E1ZB
                    </div>
                  </div>
                  <div className="d-flex flex-column align-items-center">
                    <img src={beatslogo} alt="Beats Production" style={{ width: "120px", height: "120px", objectFit: "contain" }} />
                  </div>
                </div>
                <hr style={{ borderTop: "2px solid #111", margin: "15px 0" }} />
                <div className="row mb-4">
                  <div className="col-7">
                    <h3 className="fw-bold mb-2" style={{ fontSize: "1rem" }}>Bill To</h3>
                    <div style={{ fontSize: "0.85rem", lineHeight: "1.4" }}>
                      {creditNoteForm.companyName ? (
                        <>
                          <strong className="d-block mb-0" style={{ fontSize: "1rem" }}>{creditNoteForm.companyName}</strong>
                          {creditNoteForm.clientName && <span className="text-secondary small d-block mb-1">Attn: {creditNoteForm.clientName}</span>}
                        </>
                      ) : (
                        <strong className="d-block mb-1">{creditNoteForm.clientName}</strong>
                      )}
                      <div style={{ whiteSpace: "pre-wrap", color: "#333" }}>{creditNoteForm.clientAddress}</div>
                      {creditNoteForm.clientGst && <div className="mt-1"><strong>GSTIN:</strong> {creditNoteForm.clientGst}</div>}
                    </div>
                  </div>
                  <div className="col-5 text-end">
                    <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
                      <div className="d-flex justify-content-end align-items-center">
                        <span className="text-secondary me-2 fw-bold" style={{ fontSize: "1rem" }}>Note No :</span>
                        <strong style={{ fontSize: "1.2rem", fontFamily: "monospace" }}>{creditNoteForm.invoiceNumber}</strong>
                      </div>
                      <div><span className="text-secondary me-2">Date :</span><span>{formatDateShort(creditNoteForm.invoiceDate)}</span></div>
                      <div><span className="text-secondary me-2">Parent Invoice :</span><strong className="font-monospace text-primary">{creditNoteForm.parentInvoiceNumber}</strong></div>
                    </div>
                  </div>
                </div>
                <div className="table-responsive border border-secondary border-opacity-25 rounded-0 mb-2" style={{ overflow: "hidden" }}>
                  <table className="table mb-0 align-middle">
                    <thead>
                      <tr>
                        <th className="pdf-table-header text-center" style={{ width: "6%" }}>Sl.</th>
                        <th className="pdf-table-header" style={{ width: "54%" }}>Credit Adjustment Details</th>
                        <th className="pdf-table-header text-center" style={{ width: "10%" }}>Qty</th>
                        <th className="pdf-table-header text-end" style={{ width: "15%" }}>Rate</th>
                        <th className="pdf-table-header text-end" style={{ width: "15%" }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {creditNoteForm.items.map((item, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
                          <td className="text-center font-monospace">{idx + 1}</td>
                          <td>{item.description}</td>
                          <td className="text-center font-monospace">{item.quantity}</td>
                          <td className="text-end font-monospace">{formatINR(item.rate)}</td>
                          <td className="text-end font-monospace">{formatINR(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="row g-3" style={{ fontSize: "0.85rem" }}>
                  <div className="col-7">
                    <h4 className="fw-bold mb-2" style={{ fontSize: "0.9rem" }}>Adjustment Notes</h4>
                    <p className="text-secondary">{creditNoteForm.notes || "No extra remarks provided."}</p>
                  </div>
                  <div className="col-5">
                    <table className="w-100 align-middle" style={{ borderCollapse: "collapse", lineHeight: "1.6" }}>
                      <tbody>
                        <tr><td>Subtotal Credit</td><td className="text-end font-monospace">₹ {formatINR(creditNoteForm.subtotal)}</td></tr>
                        <tr><td>CGST ({creditNoteForm.cgstRate}%)</td><td className="text-end font-monospace">₹ {formatINR(creditNoteForm.cgstAmount)}</td></tr>
                        <tr style={{ borderBottom: "1px solid #aaa" }}><td className="pb-1">SGST ({creditNoteForm.sgstRate}%)</td><td className="text-end font-monospace pb-1">₹ {formatINR(creditNoteForm.sgstAmount)}</td></tr>
                        <tr className="fw-extrabold" style={{ fontSize: "0.95rem" }}><td className="pt-2">Total Credit Adjusted</td><td className="text-end font-monospace pt-2">₹ {formatINR(creditNoteForm.totalAmount)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4" style={{ fontSize: "0.85rem" }}>
                  <strong>Total Credit Adjusted (in words) :</strong><br />
                  <span className="fw-bold mt-1 d-block text-secondary">{creditNoteForm.totalAmountWords}</span>
                </div>
              </div>

              <div className="invoice-paper-preview invoice-page shadow" id="invoice-page-2">
                <div style={{ minHeight: "80%" }}>
                  <div className="mb-4" style={{ fontSize: "0.75rem", color: "#444", textAlign: "justify" }}>
                    <strong className="d-block mb-2 text-dark">Terms</strong>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.3" }}>{creditNoteForm.terms}</div>
                  </div>
                  <div className="border border-secondary border-opacity-25 p-3 rounded-1 mb-5" style={{ fontSize: "0.85rem", color: "#333", backgroundColor: "#f9f9f9" }}>
                    By signing this document, the customer agrees to the credit adjustments listed.
                  </div>
                  <div className="d-flex justify-content-between align-items-end mt-5 pt-5" style={{ padding: "0 10px" }}>
                    <div className="text-center" style={{ width: "40%" }}>
                      <div className="mb-2 d-flex justify-content-center" style={{ height: "70px" }}>
                        <svg width="150" height="70" viewBox="0 0 150 70" xmlns="http://www.w3.org/2000/svg">
                          <path d="M 10 45 Q 25 15, 35 25 T 55 10 T 65 35 T 80 20 T 95 40 T 115 15 T 135 30" fill="none" stroke="#111" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M 20 40 L 130 35" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      </div>
                      <div style={{ borderTop: "1px solid #111", paddingTop: "5px", fontSize: "0.85rem" }}><strong>For Beats Production Private Limited</strong></div>
                    </div>
                    <div className="text-center" style={{ width: "40%" }}>
                      <div className="mb-2" style={{ height: "70px" }}></div>
                      <div style={{ borderTop: "1px solid #111", paddingTop: "5px", fontSize: "0.85rem" }}><strong>Client Signatory</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminCreditNotes;
