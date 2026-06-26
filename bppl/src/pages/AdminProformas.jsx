import { useState, useEffect } from "react";
import { getProformas, createProforma, updateProforma, deleteProforma, createInvoice } from "../services/api";
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
    return `${day} ${months[date.getMonth()]}, ${date.getFullYear()}`;
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

function AdminProformas() {
  const [proformas, setProformas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState("list");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  const [proformaForm, setProformaForm] = useState({
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    eventDate: "",
    clientName: "",
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
    status: "Draft",
    sourceQuotationId: ""
  });
  
  const [currentId, setCurrentId] = useState(null);

  useEffect(() => { loadProformas(); }, []);

  const loadProformas = async () => {
    setLoading(true);
    try {
      const res = await getProformas();
      setProformas(res.data.reverse());
    } catch (e) { console.error("Error loading proformas:", e); }
    finally { setLoading(false); }
  };

  const generateProformaNumber = () => {
    const dateObj = new Date();
    const year = dateObj.getFullYear();
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    return `PI-${year}-${randomSuffix}`;
  };

  const handleOpenAddForm = () => {
    setProformaForm({
      invoiceNumber: generateProformaNumber(),
      invoiceDate: new Date().toISOString().split("T")[0],
      eventDate: "",
      clientName: "",
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
      status: "Draft",
      sourceQuotationId: ""
    });
    setErrorMsg("");
    setSuccessMsg("");
    setViewState("add");
  };

  const handleOpenEditForm = (prof) => {
    setCurrentId(prof._id);
    setProformaForm({ ...prof });
    setErrorMsg("");
    setSuccessMsg("");
    setViewState("edit");
  };

  const handleOpenPreview = (prof) => {
    setCurrentId(prof._id);
    setProformaForm({ ...prof });
    setViewState("preview");
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
    const updatedItems = [...proformaForm.items];
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
    const calc = recalculateAmounts(updatedItems, proformaForm.cgstRate, proformaForm.sgstRate, proformaForm.paidAmount);
    setProformaForm({ ...proformaForm, items: updatedItems, ...calc });
  };

  const handleAddItemRow = () => {
    const updatedItems = [...proformaForm.items, { description: "", quantity: 1, rate: 0, amount: 0 }];
    const calc = recalculateAmounts(updatedItems, proformaForm.cgstRate, proformaForm.sgstRate, proformaForm.paidAmount);
    setProformaForm({ ...proformaForm, items: updatedItems, ...calc });
  };

  const handleRemoveItemRow = (index) => {
    if (proformaForm.items.length === 1) return;
    const updatedItems = proformaForm.items.filter((_, idx) => idx !== index);
    const calc = recalculateAmounts(updatedItems, proformaForm.cgstRate, proformaForm.sgstRate, proformaForm.paidAmount);
    setProformaForm({ ...proformaForm, items: updatedItems, ...calc });
  };

  const handleFinancialFieldChange = (field, value) => {
    const updatedForm = { ...proformaForm, [field]: parseFloat(value) || 0 };
    const calc = recalculateAmounts(updatedForm.items, updatedForm.cgstRate, updatedForm.sgstRate, updatedForm.paidAmount);
    setProformaForm({ ...updatedForm, ...calc });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    if (!proformaForm.invoiceNumber.trim()) { setErrorMsg("Proforma invoice number is required."); return; }
    try {
      if (viewState === "add") {
        await createProforma(proformaForm);
        setSuccessMsg("Proforma Invoice created successfully!");
      } else {
        await updateProforma(currentId, proformaForm);
        setSuccessMsg("Proforma Invoice updated successfully!");
      }
      setTimeout(() => { setViewState("list"); loadProformas(); }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "An error occurred saving the proforma invoice.");
    }
  };

  const handleConvertToRealInvoice = async (prof) => {
    if (!window.confirm("Convert this Proforma Invoice to a Tax Invoice?")) return;
    try {
      const invoiceData = {
        ...prof,
        invoiceNumber: "BP-" + new Date().getFullYear() + "-" + Math.floor(1000 + Math.random() * 9000),
        status: "Pending",
        sourceProformaId: prof._id
      };
      delete invoiceData._id;
      // 1. Create Tax Invoice
      await createInvoice(invoiceData);
      // 2. Mark Proforma status as Converted
      await updateProforma(prof._id, { ...prof, status: "Converted" });
      alert("Proforma Invoice converted to Tax Invoice successfully!");
      loadProformas();
    } catch (err) {
      alert("Conversion failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleDeleteProforma = async (id) => {
    if (window.confirm("Are you sure you want to delete this proforma invoice?")) {
      try {
        await deleteProforma(id);
        loadProformas();
      } catch (err) { alert(err.response?.data?.detail || "Failed to delete proforma invoice"); }
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
        filename: `${proformaForm.invoiceNumber}.pdf`,
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

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Accepted": case "Converted": return "bg-success text-white px-3 py-2 rounded-3 small fw-bold font-monospace";
      case "Cancelled": case "Expired": return "bg-danger text-white px-3 py-2 rounded-3 small fw-bold font-monospace";
      case "Sent": return "bg-primary text-white px-3 py-2 rounded-3 small fw-bold font-monospace";
      default: return "bg-secondary text-white px-3 py-2 rounded-3 small fw-bold font-monospace";
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
                {viewState === "list" && "Proforma Invoice Management"}
                {viewState === "add" && "Create Proforma Invoice"}
                {viewState === "edit" && "Edit Proforma Invoice"}
                {viewState === "preview" && "Proforma Invoice Print Preview"}
              </h2>
              <p className="text-muted small m-0 mt-1">
                {viewState === "list" && "Manage client proforma invoices"}
                {viewState === "preview" && "Emulated PDF layout view. Ready for print output."}
              </p>
            </div>
            <div className="d-flex gap-2">
              {viewState === "list" && (
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddForm}>
                  <span>➕</span> Create Proforma
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
                        <th>Proforma No.</th>
                        <th>Client</th>
                        <th>Date</th>
                        <th>Event Date</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                        <th className="text-center" style={{ width: "300px" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proformas.map((prof) => (
                        <tr key={prof._id}>
                          <td><strong className="text-primary font-monospace">{prof.invoiceNumber}</strong></td>
                          <td>
                            <div>
                              <div className="fw-bold text-dark">{prof.clientName}</div>
                              {prof.clientGst && <div className="text-muted small font-monospace">GST: {prof.clientGst}</div>}
                            </div>
                          </td>
                          <td className="font-monospace text-secondary">{formatDateShort(prof.invoiceDate)}</td>
                          <td className="text-secondary">{prof.eventDate || "-"}</td>
                          <td><span className="fw-extrabold text-dark font-monospace">₹{formatINR(prof.totalAmount)}</span></td>
                          <td><span className={getStatusBadgeClass(prof.status)}>{prof.status}</span></td>
                          <td className="text-center">
                            <button className="btn btn-sm btn-info text-white me-2 px-2 fw-bold" onClick={() => handleOpenPreview(prof)}>Preview</button>
                            {prof.status !== "Converted" && (
                              <button className="btn btn-sm btn-outline-primary me-2 px-2" onClick={() => handleConvertToRealInvoice(prof)}>→ Invoice</button>
                            )}
                            <button className="btn btn-sm btn-light me-2 px-2" onClick={() => handleOpenEditForm(prof)}>Edit</button>
                            <button className="btn btn-sm btn-danger px-2" onClick={() => handleDeleteProforma(prof._id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (viewState === "add" || viewState === "edit") ? (
            <div className="card shadow-sm border-0 fade-in">
              <div className="card-header card-gradient-blue p-4 border-0">
                <h5 className="mb-0 fw-bold">Proforma Invoice Details</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Proforma Number</label>
                      <input type="text" className="form-control font-monospace fw-bold" required value={proformaForm.invoiceNumber} onChange={(e) => setProformaForm({ ...proformaForm, invoiceNumber: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Date</label>
                      <input type="date" className="form-control" required value={proformaForm.invoiceDate} onChange={(e) => setProformaForm({ ...proformaForm, invoiceDate: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Event Date(s)</label>
                      <input type="text" className="form-control" placeholder="e.g. 22,24 and 25april" value={proformaForm.eventDate} onChange={(e) => setProformaForm({ ...proformaForm, eventDate: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-3">
                      <label className="form-label font-monospace text-secondary small fw-bold">Status</label>
                      <select className="form-select" value={proformaForm.status} onChange={(e) => setProformaForm({ ...proformaForm, status: e.target.value })}>
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Expired">Expired</option>
                        <option value="Converted">Converted</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <h5 className="fw-bold mb-3">Client Information</h5>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">Company Name</label>
                      <input type="text" className="form-control" required value={proformaForm.clientName} onChange={(e) => setProformaForm({ ...proformaForm, clientName: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">Address</label>
                      <textarea className="form-control" rows="2" required value={proformaForm.clientAddress} onChange={(e) => setProformaForm({ ...proformaForm, clientAddress: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label font-monospace text-secondary small fw-bold">GSTIN</label>
                      <input type="text" className="form-control font-monospace" value={proformaForm.clientGst} onChange={(e) => setProformaForm({ ...proformaForm, clientGst: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-2">
                      <label className="form-label font-monospace text-secondary small fw-bold">Email</label>
                      <input type="email" className="form-control" value={proformaForm.clientEmail} onChange={(e) => setProformaForm({ ...proformaForm, clientEmail: e.target.value })} />
                    </div>
                  </div>
                  <hr className="my-4 border-secondary-subtle" />
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="fw-bold mb-0">Line Items</h5>
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddItemRow}>➕ Add Item</button>
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
                        {proformaForm.items.map((item, idx) => (
                          <tr key={idx}>
                            <td><input type="text" className="form-control" required value={item.description} onChange={(e) => handleItemChange(idx, "description", e.target.value)} /></td>
                            <td><input type="number" className="form-control text-center font-monospace" required min="0.01" step="any" value={item.quantity} onChange={(e) => handleItemChange(idx, "quantity", e.target.value)} /></td>
                            <td><input type="number" className="form-control text-end font-monospace" required min="0.00" step="any" value={item.rate} onChange={(e) => handleItemChange(idx, "rate", e.target.value)} /></td>
                            <td className="text-end font-monospace fw-bold text-secondary">₹{formatINR(item.amount)}</td>
                            <td className="text-center">
                              <button type="button" className="btn btn-sm btn-outline-danger" disabled={proformaForm.items.length === 1} onClick={() => handleRemoveItemRow(idx)}>🗑️</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="row g-4 mb-4">
                    <div className="col-12 col-md-6">
                      <div className="row g-3">
                        <div className="col-6">
                          <label className="form-label font-monospace text-secondary small fw-bold">CGST Rate (%)</label>
                          <input type="number" className="form-control font-monospace" value={proformaForm.cgstRate} onChange={(e) => handleFinancialFieldChange("cgstRate", e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="form-label font-monospace text-secondary small fw-bold">SGST Rate (%)</label>
                          <input type="number" className="form-control font-monospace" value={proformaForm.sgstRate} onChange={(e) => handleFinancialFieldChange("sgstRate", e.target.value)} />
                        </div>
                      </div>
                    </div>
                    <div className="col-12 col-md-6">
                      <div className="card bg-light border-0 p-3 shadow-sm text-end">
                        <div className="d-flex justify-content-between mb-2"><span>Subtotal:</span><span className="fw-bold font-monospace">₹{formatINR(proformaForm.subtotal)}</span></div>
                        <div className="d-flex justify-content-between mb-2"><span>CGST ({proformaForm.cgstRate}%):</span><span className="fw-bold font-monospace">₹{formatINR(proformaForm.cgstAmount)}</span></div>
                        <div className="d-flex justify-content-between mb-2"><span>SGST ({proformaForm.sgstRate}%):</span><span className="fw-bold font-monospace">₹{formatINR(proformaForm.sgstAmount)}</span></div>
                        <hr className="my-2" />
                        <div className="d-flex justify-content-between mb-2"><span className="fw-bold text-primary">GRAND TOTAL:</span><span className="fw-extrabold font-monospace text-primary fs-5">₹{formatINR(proformaForm.totalAmount)}</span></div>
                      </div>
                    </div>
                  </div>
                  <div className="row g-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Total Amount in Words</label>
                      <input type="text" className="form-control fw-bold font-monospace" value={proformaForm.totalAmountWords} onChange={(e) => setProformaForm({ ...proformaForm, totalAmountWords: e.target.value })} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Remarks (Optional)</label>
                      <textarea className="form-control" rows="2" value={proformaForm.notes} onChange={(e) => setProformaForm({ ...proformaForm, notes: e.target.value })} />
                    </div>
                    <div className="col-12">
                      <label className="form-label font-monospace text-secondary small fw-bold">Terms &amp; Conditions</label>
                      <textarea className="form-control font-monospace small" rows="5" value={proformaForm.terms} onChange={(e) => setProformaForm({ ...proformaForm, terms: e.target.value })} />
                    </div>
                  </div>
                  <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                    <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setViewState("list")}>Cancel</button>
                    <button type="submit" className="btn btn-primary px-5">{viewState === "add" ? "Create Proforma" : "Save Changes"}</button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            /* PREVIEW LAYOUT VIEW */
            <div className="d-flex flex-column align-items-center bg-dark bg-opacity-10 py-4 overflow-auto rounded-3">
              <div className="invoice-paper-preview invoice-page mb-5 shadow" id="invoice-page-1">
                <div className="text-center mb-4">
                  <h1 className="fw-extrabold text-uppercase m-0" style={{ fontSize: "2.1rem", letterSpacing: "3px" }}>Proforma Invoice</h1>
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
                      <strong className="d-block mb-1">{proformaForm.clientName}</strong>
                      <div style={{ whiteSpace: "pre-wrap", color: "#333" }}>{proformaForm.clientAddress}</div>
                      {proformaForm.clientGst && <div className="mt-1"><strong>GSTIN:</strong> {proformaForm.clientGst}</div>}
                    </div>
                  </div>
                  <div className="col-5 text-end">
                    <div className="d-flex flex-column gap-2" style={{ fontSize: "0.85rem" }}>
                      <div className="d-flex justify-content-end align-items-center">
                        <span className="text-secondary me-2 fw-bold" style={{ fontSize: "1rem" }}>Proforma No :</span>
                        <strong style={{ fontSize: "1.2rem", fontFamily: "monospace" }}>{proformaForm.invoiceNumber}</strong>
                      </div>
                      <div><span className="text-secondary me-2">Date :</span><span>{formatDateShort(proformaForm.invoiceDate)}</span></div>
                      <div><span className="text-secondary me-2">Event Date :</span><span>{proformaForm.eventDate || "-"}</span></div>
                    </div>
                  </div>
                </div>
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
                      {proformaForm.items.map((item, idx) => (
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
                    <h4 className="fw-bold mb-2" style={{ fontSize: "0.9rem" }}>Payment Instructions</h4>
                    <div className="text-secondary" style={{ lineHeight: "1.4" }}>
                      Send bank transfer to:<br />
                      <strong>Account Name :</strong> {proformaForm.bankAccountName}<br />
                      <strong>Account No :</strong> {proformaForm.bankAccountNumber}<br />
                      <strong>IFSC Code :</strong> {proformaForm.bankIfsc}<br />
                      <strong>Bank Name :</strong> {proformaForm.bankName}
                    </div>
                  </div>
                  <div className="col-5">
                    <table className="w-100 align-middle" style={{ borderCollapse: "collapse", lineHeight: "1.6" }}>
                      <tbody>
                        <tr><td>Subtotal</td><td className="text-end font-monospace">₹ {formatINR(proformaForm.subtotal)}</td></tr>
                        <tr><td>CGST ({proformaForm.cgstRate}%)</td><td className="text-end font-monospace">₹ {formatINR(proformaForm.cgstAmount)}</td></tr>
                        <tr style={{ borderBottom: "1px solid #aaa" }}><td className="pb-1">SGST ({proformaForm.sgstRate}%)</td><td className="text-end font-monospace pb-1">₹ {formatINR(proformaForm.sgstAmount)}</td></tr>
                        <tr className="fw-extrabold" style={{ fontSize: "0.95rem" }}><td className="pt-2">Total</td><td className="text-end font-monospace pt-2">₹ {formatINR(proformaForm.totalAmount)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="mt-4" style={{ fontSize: "0.85rem" }}>
                  <strong>Total Amount (in words) :</strong><br />
                  <span className="fw-bold mt-1 d-block text-secondary">{proformaForm.totalAmountWords}</span>
                </div>
              </div>

              <div className="invoice-paper-preview invoice-page shadow" id="invoice-page-2">
                <div style={{ minHeight: "80%" }}>
                  <div className="mb-4" style={{ fontSize: "0.75rem", color: "#444", textAlign: "justify" }}>
                    <strong className="d-block mb-2 text-dark">Terms</strong>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.3" }}>{proformaForm.terms}</div>
                  </div>
                  <div className="border border-secondary border-opacity-25 p-3 rounded-1 mb-5" style={{ fontSize: "0.85rem", color: "#333", backgroundColor: "#f9f9f9" }}>
                    By signing this document, the customer agrees to the services and conditions described in this document.
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

export default AdminProformas;
