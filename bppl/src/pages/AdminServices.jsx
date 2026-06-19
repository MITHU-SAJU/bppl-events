import { useState, useEffect } from "react";
import { getParticulars, createParticular, deleteParticular } from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const CATEGORIES = [
  "Photo Booths",
  "Games",
  "Drones 500grm",
  "Robots",
  "Hologram fan",
  "Sensors Activities & IOT devices",
  "Web Applications SDK",
  "Workshop & Fun",
  "Printers",
  "Casting",
  "Projection",
  "Other"
];

function AdminServices() {
  const [particulars, setParticulars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newService, setNewService] = useState({ name: "", category: CATEGORIES[0] });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    loadParticulars();
  }, []);

  const loadParticulars = async () => {
    setLoading(true);
    try {
      const res = await getParticulars();
      setParticulars(res.data);
    } catch (e) {
      console.error("Error loading services:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    
    if (!newService.name.trim()) return;

    try {
      await createParticular({
        name: newService.name.trim(),
        category: newService.category
      });
      setNewService({ name: "", category: CATEGORIES[0] });
      setMessage("Service added successfully!");
      loadParticulars();
    } catch (err) {
      setIsError(true);
      setMessage(err.response?.data?.detail || "Failed to add service");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      try {
        await deleteParticular(id);
        loadParticulars();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to delete service");
      }
    }
  };

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        
        <div className="flex-grow-1 p-4 fade-in" style={{ overflowY: "auto" }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-extrabold m-0" style={{ letterSpacing: "-1px" }}>Manage Services (Particulars)</h2>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadParticulars}>
              Refresh List
            </button>
          </div>

          <div className="row g-4">
            {/* Add Service Form */}
            <div className="col-12 col-md-5">
              <div className="card shadow-sm border-0 h-100 card-gradient-blue">
                <div className="card-header bg-dark bg-opacity-20 py-3 px-4 border-0">
                  <h5 className="mb-0 fw-bold">Add New Particular</h5>
                </div>
                <div className="card-body p-4 d-flex flex-column justify-content-between">
                  <div>
                    {message && (
                      <div className={`alert border-0 py-2 px-3 small rounded-3 mb-3 ${
                        isError ? "bg-danger bg-opacity-20 text-white" : "bg-success bg-opacity-20 text-white"
                      }`}>
                        {isError ? "⚠️" : "✅"} {message}
                      </div>
                    )}
                    
                    <form onSubmit={handleAdd}>
                      <div className="mb-3">
                        <label className="form-label font-monospace small text-white-50">Service Name</label>
                        <input
                          type="text"
                          className="form-control"
                          required
                          placeholder="e.g. Interactive AI Mirror"
                          value={newService.name}
                          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        />
                      </div>
                      <div className="mb-4">
                        <label className="form-label font-monospace small text-white-50">Category</label>
                        <select
                          className="form-select"
                          required
                          value={newService.category}
                          onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button type="submit" className="btn btn-light w-100 py-2 fw-bold text-primary">
                        Save Service
                      </button>
                    </form>
                  </div>
                  
                  <div className="mt-4 pt-3 border-top border-white-50 small text-white-50">
                    💡 Registered services immediately become options inside the employee registration form and events editor.
                  </div>
                </div>
              </div>
            </div>

            {/* Services List Table */}
            <div className="col-12 col-md-7">
              <div className="card shadow-sm p-3 h-100">
                <h5 className="fw-bold mb-3 px-2">Service Catalog</h5>
                {loading ? (
                  <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive border-0" style={{ maxHeight: "400px", overflowY: "auto" }}>
                    <table className="table table-hover align-middle mb-0">
                      <thead>
                        <tr>
                          <th>Service Name</th>
                          <th>Category</th>
                          <th className="text-center" style={{ width: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {particulars.map((part) => (
                          <tr key={part._id}>
                            <td className="fw-bold text-dark">{part.name}</td>
                            <td>
                              <span className="badge bg-secondary font-monospace">
                                {part.category || "Other"}
                              </span>
                            </td>
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-danger px-2"
                                onClick={() => handleDelete(part._id)}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                        {particulars.length === 0 && (
                          <tr>
                            <td colSpan="3" className="text-center py-5 text-muted">
                              No services registered in the database.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminServices;
