import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getEvents, getEmployees, getParticulars } from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [particularsList, setParticularsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEventName, setFilterEventName] = useState("");
  const [filterEventPlace, setFilterEventPlace] = useState("");
  const [filterParticulars, setFilterParticulars] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, employeesRes, particularsRes] = await Promise.all([
        getEvents(),
        getEmployees(),
        getParticulars(),
      ]);
      setEvents(eventsRes.data);
      setEmployees(employeesRes.data);
      setParticularsList(particularsRes.data);
    } catch (e) {
      console.error("Error loading events, employees and particulars data:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterEventName("");
    setFilterEventPlace("");
    setFilterParticulars("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // Filter events logic
  const filteredEvents = events.filter((event) => {
    const empName = (event.employeeName || event.employee_name || "").toLowerCase();
    const empId = (event.employeeId || event.employee_id || "").toLowerCase();
    const evtName = (event.eventName || event.event_name || "").toLowerCase();
    const evtPlace = (event.eventPlace || event.location || "").toLowerCase();
    const particulars = (event.particulars || "").toLowerCase();
    const startDate = event.startDate || event.start_date || "";
    const endDate = event.endDate || event.end_date || "";

    const matchesSearch =
      empName.includes(searchTerm.toLowerCase()) ||
      empId.includes(searchTerm.toLowerCase()) ||
      particulars.includes(searchTerm.toLowerCase());

    const matchesEventName = filterEventName
      ? evtName.includes(filterEventName.toLowerCase())
      : true;

    const matchesEventPlace = filterEventPlace
      ? evtPlace.includes(filterEventPlace.toLowerCase())
      : true;

    const matchesParticulars = filterParticulars
      ? particulars.includes(filterParticulars.toLowerCase())
      : true;

    const matchesStartDate = filterStartDate
      ? startDate >= filterStartDate
      : true;

    const matchesEndDate = filterEndDate
      ? endDate <= filterEndDate
      : true;
      
    return matchesSearch && matchesEventName && matchesEventPlace && matchesParticulars && matchesStartDate && matchesEndDate;
  });

  // Group filtered events by employee to display a clean summary list
  const employeeSummaries = [];
  const groups = {};

  filteredEvents.forEach((event) => {
    const empId = event.employeeId || event.employee_id || "unknown";
    if (!groups[empId]) {
      groups[empId] = {
        employeeId: empId,
        employeeName: event.employeeName || event.employee_name || "Unknown",
        events: []
      };
    }
    groups[empId].events.push(event);
  });

  // Convert groups map to array and compute event stats per employee
  Object.keys(groups).forEach((empId) => {
    const group = groups[empId];
    
    // Extract unique event names
    const uniqueEventsAttended = [...new Set(group.events.map(e => e.eventName || e.event_name || ""))].filter(Boolean);
    
    // Sum duration
    const totalDays = group.events.reduce((sum, e) => sum + Number(e.days || 0), 0);
    
    employeeSummaries.push({
      employeeId: empId,
      employeeName: group.employeeName,
      eventsAttended: uniqueEventsAttended.join(", "),
      totalEventsCount: group.events.length,
      totalDays: totalDays
    });
  });

  // Sort employee summaries alphabetically by employee name
  employeeSummaries.sort((a, b) => a.employeeName.localeCompare(b.employeeName));

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <div className="flex-grow-1 p-4 fade-in" style={{ overflowY: "auto" }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-extrabold m-0" style={{ letterSpacing: "-1px" }}>Manage Events</h2>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadData}>
              Refresh Table
            </button>
          </div>

          {/* Search and Filter Panel */}
          <div className="card p-4 mb-4 shadow-sm">
            <h5 className="fw-bold mb-3">Filters & Advanced Search</h5>
            <div className="row g-3">
              <div className="col-12 col-md-3">
                <label className="form-label font-monospace text-secondary small">Search Employee</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Name or Employee ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-2">
                <label className="form-label font-monospace text-secondary small">Event Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Conference"
                  value={filterEventName}
                  onChange={(e) => setFilterEventName(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-2">
                <label className="form-label font-monospace text-secondary small">Event Place</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mumbai"
                  value={filterEventPlace}
                  onChange={(e) => setFilterEventPlace(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-2">
                <label className="form-label font-monospace text-secondary small">Particulars</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 360 Booth"
                  value={filterParticulars}
                  onChange={(e) => setFilterParticulars(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-1-5" style={{ flex: "0 0 auto", width: "12.5%" }}>
                <label className="form-label font-monospace text-secondary small">From Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-md-1-5" style={{ flex: "0 0 auto", width: "12.5%" }}>
                <label className="form-label font-monospace text-secondary small">To Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
            </div>
            <div className="d-flex justify-content-end mt-3">
              <button className="btn btn-outline-secondary btn-sm" onClick={handleResetFilters}>
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Events Table */}
          <div className="card shadow-sm p-3">
            {loading ? (
              <div className="text-center my-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive border-0">
                <table className="table table-hover align-middle mb-0">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Employee ID</th>
                      <th>Events Attended</th>
                      <th>Total Events</th>
                      <th>Total Days</th>
                      <th className="text-center" style={{ width: "200px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeSummaries.map((summary, idx) => (
                      <tr key={summary.employeeId || idx}>
                        <td className="fw-bold">
                          <Link 
                            to={`/admin/employee/${summary.employeeId}`} 
                            className="text-primary text-decoration-none"
                            style={{ borderBottom: "1px dashed rgba(59, 130, 246, 0.4)", paddingBottom: "2px" }}
                          >
                            {summary.employeeName}
                          </Link>
                        </td>
                        <td>
                          <span className="badge bg-secondary font-monospace">
                            {summary.employeeId}
                          </span>
                        </td>
                        <td>
                          {summary.eventsAttended ? (
                            <span className="text-secondary small fw-normal">
                              {summary.eventsAttended}
                            </span>
                          ) : (
                            <em className="text-muted small">None</em>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border font-monospace">
                            {summary.totalEventsCount} {summary.totalEventsCount === 1 ? "event" : "events"}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {summary.totalDays} {summary.totalDays === 1 ? "day" : "days"}
                          </span>
                        </td>
                        <td className="text-center">
                          <Link
                            to={`/admin/employee/${summary.employeeId}`}
                            className="btn btn-sm btn-primary text-white"
                          >
                            View & Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                    {employeeSummaries.length === 0 && (
                      <tr>
                        <td colSpan="6" className="text-center py-5 text-muted">
                          No employees or events match the current search filters.
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
  );
}

export default AdminEvents;
