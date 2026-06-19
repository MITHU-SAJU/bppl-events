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
      setMessage("Event submitted successfully!");
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
      className="d-flex justify-content-center align-items-center min-vh-100 py-5 px-3"
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

      <div className="card shadow mx-auto fade-in" style={{ maxWidth: "600px", width: "100%", zIndex: 10 }}>
        <div 
          className="card-header py-4 px-4 d-flex align-items-center justify-content-between text-white"
          style={{ background: "var(--header-grad)", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}
        >
          <div>
            <h4 className="mb-0 fw-extrabold text-white" style={{ letterSpacing: "-0.5px" }}>Employee Event Registration</h4>
            <p className="mb-0 small mt-1" style={{ color: "rgba(255, 255, 255, 0.8)" }}>Submit your travel/event logs to the database</p>
          </div>
          <span style={{ fontSize: "1.8rem" }}>✈️</span>
        </div>
        
        <div className="card-body p-4 p-sm-5">
          {message && (
            <div className={`alert border-0 py-3 px-4 mb-4 rounded-3 fade-in ${
              isError 
                ? "bg-danger bg-opacity-10 text-danger" 
                : "bg-success bg-opacity-10 text-success"
            }`}>
              {isError ? "⚠️" : "✅"} {message}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label font-monospace text-secondary small">Employee Name</label>
              <select
                className="form-select"
                required
                value={formData.employeeId}
                onChange={handleEmployeeChange}
              >
                <option value="">Select Employee</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp.employeeId}>
                    {emp.name} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label font-monospace text-secondary small">Particulars / Services Selected</label>
              <SearchableSelect
                options={particularsList}
                value={formData.particulars}
                onChange={handleParticularsChange}
                onRefresh={fetchParticulars}
                required
              />
            </div>

            <div className="row g-3 mb-4">
              <div className="col-sm-6">
                <label className="form-label font-monospace text-secondary small">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="col-sm-6">
                <label className="form-label font-monospace text-secondary small">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
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

            <div className="mb-4">
              <label className="form-label font-monospace text-secondary small">Event Name</label>
              <input
                type="text"
                className="form-control"
                name="eventName"
                value={formData.eventName}
                onChange={handleChange}
                placeholder="e.g. Annual Tech Symposium"
                required
              />
            </div>

            <div className="mb-4">
              <label className="form-label font-monospace text-secondary small">Event Place</label>
              <input
                type="text"
                className="form-control"
                name="eventPlace"
                value={formData.eventPlace}
                onChange={handleChange}
                placeholder="e.g. Bangalore"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-100 py-3 mt-3">
              Submit Event Details
            </button>
          </form>
        </div>

        <div className="card-footer bg-light py-3 text-center">
          <a href="/login" className="text-secondary text-decoration-none small hover-underline" style={{ transition: "color 0.2s" }} onMouseEnter={(e)=>e.target.style.color="var(--text-primary)"} onMouseLeave={(e)=>e.target.style.color="var(--text-muted)"}>
            🔒 Go to Admin Dashboard login
          </a>
        </div>
      </div>
    </div>
  );
}

export default EmployeeForm;
