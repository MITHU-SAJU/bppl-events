import { useState, useEffect } from "react";
import { getEmployees, createEvent, getParticulars } from "../services/api";
import SearchableSelect from "../components/SearchableSelect";

function EmployeeForm() {
  const [employees, setEmployees] = useState([]);
  const [particularsList, setParticularsList] = useState([]);
  const [formData, setFormData] = useState({
    employeeId: "",
    employeeName: "",
    startDate: "",
    endDate: "",
    eventName: "",
    eventPlace: "",
    particulars: "",
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchParticulars();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await getEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees", error);
    }
  };

  const fetchParticulars = async () => {
    try {
      const response = await getParticulars();
      setParticularsList(response.data);
    } catch (error) {
      console.error("Error fetching particulars", error);
    }
  };

  const handleEmployeeChange = (e) => {
    const selectedEmp = employees.find((emp) => emp.employeeId === e.target.value);
    setFormData({
      ...formData,
      employeeId: selectedEmp ? selectedEmp.employeeId : "",
      employeeName: selectedEmp ? selectedEmp.name : "",
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleParticularsChange = (val) => {
    setFormData({ ...formData, particulars: val });
  };

  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const sDate = new Date(start);
    const eDate = new Date(end);
    const diffTime = eDate - sDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    try {
      await createEvent(formData);
      setIsError(false);
      setShowSuccessModal(true); // Open the success popup modal
      
      // Auto close after 3 seconds (3000ms)
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 3000);

      setFormData({
        employeeId: "",
        employeeName: "",
        startDate: "",
        endDate: "",
        eventName: "",
        eventPlace: "",
        particulars: "",
      });
    } catch (error) {
      setIsError(true);
      setMessage("Error submitting event. Please try again.");
    }
  };

  const previewDays = calculateDays(formData.startDate, formData.endDate);

  return (
    <div 
      className="d-flex justify-content-center align-items-center min-vh-100 py-3 py-sm-5 px-2 px-sm-3"
      style={{
        background: "radial-gradient(circle at 90% 10%, #eff6ff 0%, #f1f5f9 90%)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative radial glows */}
      <div 
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          background: "var(--accent-grad)",
          borderRadius: "50%",
          filter: "blur(100px)",
          top: "-100px",
          left: "-100px",
          opacity: 0.08
        }}
      />
      <div 
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          background: "var(--primary-grad)",
          borderRadius: "50%",
          filter: "blur(100px)",
          bottom: "-150px",
          right: "-100px",
          opacity: 0.08
        }}
      />

      <div className="card shadow mx-auto fade-in w-100" style={{ maxWidth: "600px", zIndex: 10, borderRadius: "16px" }}>
        <div 
          className="card-header py-3 py-sm-4 px-3 px-sm-4 d-flex align-items-center justify-content-between text-white"
          style={{ background: "var(--header-grad)", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}
        >
          <div>
            <h4 className="mb-0 fw-extrabold text-white" style={{ letterSpacing: "-0.5px", fontSize: "1.25rem" }}>Employee Event Registration</h4>
            <p className="mb-0 small mt-1 text-white-50" style={{ fontSize: "0.8rem" }}>Submit your travel/event logs to the database</p>
          </div>
          <span style={{ fontSize: "1.8rem" }}>✈️</span>
        </div>
        
        <div className="card-body p-3 p-sm-4 p-md-5">
          {isError && message && (
            <div className="alert border-0 py-3 px-4 mb-4 rounded-3 fade-in bg-danger bg-opacity-10 text-danger" style={{ fontSize: "0.9rem" }}>
              ⚠️ {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-3 mb-sm-4">
              <label className="form-label font-monospace text-secondary small">Employee Name</label>
              <select
                className="form-select"
                required
                value={formData.employeeId}
                onChange={handleEmployeeChange}
                style={{ minHeight: "45px" }}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3 mb-sm-4">
              <label className="form-label font-monospace text-secondary small">Particulars / Services Selected</label>
              <SearchableSelect
                options={particularsList}
                value={formData.particulars}
                onChange={handleParticularsChange}
                onRefresh={fetchParticulars}
                required
                isMulti={true}
              />
            </div>

            <div className="row g-2 g-sm-3 mb-3 mb-sm-4">
              <div className="col-6">
                <label className="form-label font-monospace text-secondary small">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                  style={{ minHeight: "45px" }}
                />
              </div>
              <div className="col-6">
                <label className="form-label font-monospace text-secondary small">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  style={{ minHeight: "45px" }}
                />
              </div>
              
              {previewDays > 0 && (
                <div className="col-12 mt-1">
                  <div className="px-3 py-2 rounded font-monospace small d-inline-flex align-items-center gap-2" style={{ background: "rgba(37, 99, 235, 0.08)", color: "#1d4ed8" }}>
                    <span>⏱️</span> Calculated Duration: <strong>{previewDays} {previewDays === 1 ? "day" : "days"}</strong>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-3 mb-sm-4">
              <label className="form-label font-monospace text-secondary small">Event Name</label>
              <input
                type="text"
                className="form-control"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="e.g. Annual Tech Symposium"
                required
                style={{ minHeight: "45px" }}
              />
            </div>

            <div className="mb-3 mb-sm-4">
              <label className="form-label font-monospace text-secondary small">Event Place</label>
              <input
                type="text"
                className="form-control"
                name="eventPlace"
                value={formData.eventPlace}
                onChange={handleChange}
                placeholder="e.g. Bangalore"
                required
                style={{ minHeight: "45px" }}
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 mt-2 fw-bold" style={{ minHeight: "50px" }}>
              Submit Event Details
            </button>
          </form>
        </div>

        <div className="card-footer bg-light py-3 text-center" style={{ borderBottomLeftRadius: "16px", borderBottomRightRadius: "16px" }}>
          <a href="/login" className="text-secondary text-decoration-none small hover-underline" style={{ transition: "color 0.2s" }} onMouseEnter={(e)=>e.target.style.color="var(--text-primary)"} onMouseLeave={(e)=>e.target.style.color="var(--text-muted)"}>
            🔒 Go to Admin Dashboard login
          </a>
        </div>
      </div>

      {/* Success Modal Popup in Center */}
      {showSuccessModal && (
        <div
          className="modal show d-block fade-in px-3"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(8px)", zIndex: 1100 }}
        >
          <div className="modal-dialog modal-dialog-centered mx-auto" style={{ maxWidth: "420px" }}>
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: "20px", overflow: "hidden" }}>
              <div className="modal-body p-4 text-center">
                <div 
                  className="mx-auto mb-3 d-flex align-items-center justify-content-center bg-success bg-opacity-10 text-success rounded-circle animate-bounce"
                  style={{ width: "80px", height: "80px", fontSize: "3rem" }}
                >
                  🎉
                </div>
                <h3 className="fw-extrabold text-dark mb-2" style={{ letterSpacing: "-0.5px" }}>Success!</h3>
                <p className="text-secondary small mb-0 px-2" style={{ fontSize: "0.9rem" }}>
                  Your event registration details have been submitted successfully.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeForm;
