import { useState, useEffect } from "react";
import { getClients, createClient, updateClient, deleteClient } from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AdminClients() {
  const [clients, setClients] = useState([]);
  const [totalClients, setTotalClients] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Pagination & Search states
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // View states: "list", "add", "edit"
  const [viewState, setViewState] = useState("list");
  const [currentId, setCurrentId] = useState(null);

  const [clientForm, setClientForm] = useState({
    clientName: "",
    companyName: "",
    mobileNumber: "",
    email: "",
    gstNumber: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    notes: ""
  });

  useEffect(() => {
    loadClients();
  }, [currentPage, search]);

  const loadClients = async () => {
    setLoading(true);
    try {
      const skip = (currentPage - 1) * limit;
      const res = await getClients(search, skip, limit);
      setClients(res.data.clients);
      setTotalClients(res.data.total);
    } catch (e) {
      console.error("Error loading clients:", e);
      setErrorMsg("Failed to load clients list");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  const handleOpenAddForm = () => {
    setClientForm({
      clientName: "",
      companyName: "",
      mobileNumber: "",
      email: "",
      gstNumber: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      notes: ""
    });
    setErrorMsg("");
    setSuccessMsg("");
    setViewState("add");
  };

  const handleOpenEditForm = (client) => {
    setClientForm({
      clientName: client.clientName || "",
      companyName: client.companyName || "",
      mobileNumber: client.mobileNumber || "",
      email: client.email || "",
      gstNumber: client.gstNumber || "",
      address: client.address || "",
      city: client.city || "",
      state: client.state || "",
      pincode: client.pincode || "",
      notes: client.notes || ""
    });
    setCurrentId(client._id);
    setErrorMsg("");
    setSuccessMsg("");
    setViewState("edit");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!clientForm.clientName.trim()) {
      setErrorMsg("Client Name is required");
      return;
    }
    if (!clientForm.mobileNumber.trim()) {
      setErrorMsg("Mobile Number is required");
      return;
    }

    try {
      if (viewState === "add") {
        await createClient(clientForm);
        setSuccessMsg("Client added successfully!");
      } else {
        await updateClient(currentId, clientForm);
        setSuccessMsg("Client updated successfully!");
      }
      setTimeout(() => {
        setViewState("list");
        loadClients();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "An error occurred while saving client details");
    }
  };

  const handleDeleteClient = async (id) => {
    if (window.confirm("Are you sure you want to delete this client?")) {
      try {
        await deleteClient(id);
        loadClients();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete client");
      }
    }
  };

  const totalPages = Math.ceil(totalClients / limit) || 1;

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <div className="flex-grow-1 p-4 fade-in" style={{ overflowY: "auto" }}>
          
          {/* Header Action Bar */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-extrabold m-0" style={{ letterSpacing: "-1px" }}>
                {viewState === "list" && "Client Master"}
                {viewState === "add" && "Add New Client"}
                {viewState === "edit" && "Edit Client Details"}
              </h2>
              <p className="text-muted small m-0 mt-1">
                {viewState === "list" && "Manage client directory and invoice billing profiles"}
                {viewState === "add" && "Create client profile for Quotations, Invoices and Notes"}
                {viewState === "edit" && `Modify profile for client: ${clientForm.clientName}`}
              </p>
            </div>
            <div>
              {viewState === "list" ? (
                <button className="btn btn-primary d-flex align-items-center gap-2" onClick={handleOpenAddForm}>
                  <span>➕</span> Add New Client
                </button>
              ) : (
                <button className="btn btn-outline-secondary" onClick={() => setViewState("list")}>
                  Back to Directory
                </button>
              )}
            </div>
          </div>

          {errorMsg && <div className="alert alert-danger">{errorMsg}</div>}
          {successMsg && <div className="alert alert-success">{successMsg}</div>}

          {viewState === "list" ? (
            <div className="card shadow-sm border-0 p-4">
              
              {/* Search Bar */}
              <div className="row mb-4">
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">🔍</span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search by Name, Company, Mobile or GST..."
                      value={search}
                      onChange={handleSearchChange}
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center my-5 py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="table-responsive border-0">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-dark">
                        <tr>
                          <th>Client Name</th>
                          <th>Company Name</th>
                          <th>Mobile Number</th>
                          <th>Email Address</th>
                          <th>GST Number</th>
                          <th>City / State</th>
                          <th className="text-center" style={{ width: "180px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clients.map((c) => (
                          <tr key={c._id}>
                            <td><span className="fw-bold text-dark">{c.clientName}</span></td>
                            <td>{c.companyName || <em className="text-muted">None</em>}</td>
                            <td className="font-monospace">{c.mobileNumber}</td>
                            <td>{c.email || <em className="text-muted">None</em>}</td>
                            <td className="font-monospace">{c.gstNumber || <em className="text-muted">None</em>}</td>
                            <td>
                              {c.city || c.state ? (
                                <span>{c.city}{c.city && c.state ? ", " : ""}{c.state}</span>
                              ) : (
                                <em className="text-muted">None</em>
                              )}
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-outline-primary me-2 px-3"
                                onClick={() => handleOpenEditForm(c)}
                              >
                                Edit
                              </button>
                              <button
                                className="btn btn-sm btn-danger px-2"
                                onClick={() => handleDeleteClient(c._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {clients.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center py-5 text-muted">
                              <div className="mb-2" style={{ fontSize: "2rem" }}>👤</div>
                              <div>No clients found. Create client profiles to auto-populate invoices.</div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center mt-4">
                      <span className="text-muted small">
                        Showing {clients.length} of {totalClients} clients
                      </span>
                      <nav>
                        <ul className="pagination pagination-sm mb-0">
                          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              Previous
                            </button>
                          </li>
                          {[...Array(totalPages)].map((_, i) => (
                            <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                              <button className="page-link" onClick={() => setCurrentPage(i + 1)}>
                                {i + 1}
                              </button>
                            </li>
                          ))}
                          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </button>
                          </li>
                        </ul>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ADD / EDIT CLIENT FORM CARD */
            <div className="card shadow-sm border-0 fade-in">
              <div className="card-header bg-primary text-white p-4 border-0">
                <h5 className="mb-0 fw-bold">Client Information Form</h5>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3 mb-4">
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Client Name (Required)</label>
                      <input
                        type="text"
                        className="form-control"
                        required
                        value={clientForm.clientName}
                        onChange={(e) => setClientForm({ ...clientForm, clientName: e.target.value })}
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Company Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clientForm.companyName}
                        onChange={(e) => setClientForm({ ...clientForm, companyName: e.target.value })}
                        placeholder="e.g. Phase1 Events Pvt Ltd"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Mobile Number (Required)</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        required
                        value={clientForm.mobileNumber}
                        onChange={(e) => setClientForm({ ...clientForm, mobileNumber: e.target.value })}
                        placeholder="e.g. +91 98765 43210"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={clientForm.email}
                        onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                        placeholder="e.g. billing@client.com"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">GST Number</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={clientForm.gstNumber}
                        onChange={(e) => setClientForm({ ...clientForm, gstNumber: e.target.value })}
                        placeholder="e.g. 29AACCP2422J1ZG"
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label font-monospace text-secondary small fw-bold">Address</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clientForm.address}
                        onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })}
                        placeholder="e.g. 648, 100FT Road, Indiranagar"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">City</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clientForm.city}
                        onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                        placeholder="e.g. Bengaluru"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">State</label>
                      <input
                        type="text"
                        className="form-control"
                        value={clientForm.state}
                        onChange={(e) => setClientForm({ ...clientForm, state: e.target.value })}
                        placeholder="e.g. Karnataka"
                      />
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label font-monospace text-secondary small fw-bold">Pincode</label>
                      <input
                        type="text"
                        className="form-control font-monospace"
                        value={clientForm.pincode}
                        onChange={(e) => setClientForm({ ...clientForm, pincode: e.target.value })}
                        placeholder="e.g. 560038"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label font-monospace text-secondary small fw-bold">Notes</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={clientForm.notes}
                        onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                        placeholder="Additional remarks or profile details..."
                      />
                    </div>
                  </div>

                  <div className="d-flex justify-content-end gap-3 mt-4 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-outline-secondary px-4"
                      onClick={() => setViewState("list")}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary px-5">
                      {viewState === "add" ? "Add Client" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default AdminClients;
