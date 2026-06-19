import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getEmployees, getEmployeeEvents, updateEvent, deleteEvent, getParticulars } from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import SearchableSelect from "../components/SearchableSelect";

function AdminEmployeeHistory() {
  const { id } = useParams(); // employeeId from URL
  const [employee, setEmployee] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [particularsList, setParticularsList] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editEventData, setEditEventData] = useState({
    id: "",
    employeeId: "",
    employeeName: "",
    startDate: "",
    endDate: "",
    eventName: "",
    eventPlace: "",
    particulars: "",
  });

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEventName, setFilterEventName] = useState("");
  const [filterEventPlace, setFilterEventPlace] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");

  const handleResetFilters = () => {
    setSearchTerm("");
    setFilterEventName("");
    setFilterEventPlace("");
    setFilterStartDate("");
    setFilterEndDate("");
  };

  // Filter events logic
  const filteredEvents = events.filter((event) => {
    const evtName = (event.eventName || event.event_name || "").toLowerCase();
    const evtPlace = (event.eventPlace || event.location || "").toLowerCase();
    const particulars = (event.particulars || "").toLowerCase();
    const startDate = event.startDate || event.start_date || "";
    const endDate = event.endDate || event.end_date || "";

    const matchesSearch =
      evtName.includes(searchTerm.toLowerCase()) ||
      evtPlace.includes(searchTerm.toLowerCase()) ||
      particulars.includes(searchTerm.toLowerCase());

    const matchesEventName = filterEventName
      ? evtName.includes(filterEventName.toLowerCase())
      : true;

    const matchesEventPlace = filterEventPlace
      ? evtPlace.includes(filterEventPlace.toLowerCase())
      : true;

    const matchesStartDate = filterStartDate
      ? startDate >= filterStartDate
      : true;

    const matchesEndDate = filterEndDate
      ? endDate <= filterEndDate
      : true;

    return matchesSearch && matchesEventName && matchesEventPlace && matchesStartDate && matchesEndDate;
  });


  useEffect(() => {
    loadHistory();
  }, [id]);

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      try {
        await deleteEvent(eventId);
        loadHistory();
      } catch (e) {
        alert("Failed to delete event: " + (e.response?.data?.detail || e.message));
      }
    }
  };

  const handleEditClick = (event) => {
    setEditEventData({
      id: event._id,
      employeeId: event.employeeId || event.employee_id || "",
      employeeName: event.employeeName || event.employee_name || "",
      startDate: event.startDate || event.start_date || "",
      endDate: event.endDate || event.end_date || "",
      eventName: event.eventName || event.event_name || "",
      eventPlace: event.eventPlace || event.location || "",
      particulars: event.particulars || "",
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const { id, ...payload } = editEventData;
      await updateEvent(id, payload);
      setShowEditModal(false);
      loadHistory();
    } catch (e) {
      alert("Failed to update event: " + (e.response?.data?.detail || e.message));
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const [employeesRes, eventsRes] = await Promise.all([
        getEmployees(),
        getEmployeeEvents(id),
      ]);

      const foundEmp = employeesRes.data.find(
        (emp) => emp.employeeId === id
      );

      setEmployee(foundEmp || { employeeId: id, name: id });
      setEvents(eventsRes.data);
    } catch (e) {
      console.error("Error loading employee history:", e);
    } finally {
      setLoading(false);
    }
  };

  const totalDays = events.reduce((sum, item) => sum + Number(item.days || 0), 0);

  return (
    <div className="d-flex flex-column vh-100">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <Sidebar />
        <div className="flex-grow-1 p-4 fade-in" style={{ overflowY: "auto" }}>
          <div className="d-flex align-items-center justify-content-between mb-4">
            <div>
              <Link to="/admin/employees" className="btn btn-outline-secondary btn-sm mb-3">
                &larr; Back to Directory
              </Link>
              <h2 className="fw-extrabold m-0" style={{ letterSpacing: "-1px" }}>Employee History</h2>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadHistory}>
              Refresh Profile
            </button>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="row g-4">
              {/* Employee Summary Card */}
              <div className="col-12 col-md-6">
                <div className="card shadow-sm border-0 h-100 card-gradient-blue">
                  <div className="card-header bg-dark bg-opacity-20 py-3 px-4 border-0">
                    <h5 className="mb-0 fw-bold">Profile Info</h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="mb-3">
                      <label className="text-muted small font-monospace d-block">Employee Name</label>
                      <strong className="fs-5 fw-bold text-white">{employee.name || "N/A"}</strong>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small font-monospace d-block">Employee ID</label>
                      <span className="badge bg-secondary font-monospace mt-1">{employee.employeeId}</span>
                    </div>
                    <div className="mb-3">
                      <label className="text-muted small font-monospace d-block">Email Address</label>
                      <span className="text-white-50">{employee.email || "No email registered"}</span>
                    </div>
                    <div className="mb-0">
                      <label className="text-muted small font-monospace d-block">Department</label>
                      <span className="text-white-50 font-weight-bold text-uppercase">{employee.department || "No department assigned"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Statistics & Insights */}
              <div className="col-12 col-md-6">
                <div 
                  className="card p-4 h-100 hover-lift d-flex flex-column justify-content-center card-gradient-blue border-0"
                >
                  <div className="text-muted small font-monospace text-uppercase" style={{ letterSpacing: "1px", color: "rgba(255, 255, 255, 0.7) !important" }}>Events Attended</div>
                  <h2 className="display-3 fw-extrabold mt-3 mb-0 text-white">{events.length}</h2>
                </div>
              </div>

              {/* Filters Panel */}
              <div className="col-12 mt-2">
              <div className="card p-4 shadow-sm">
  <h5 className="fw-bold mb-3">Filter Events</h5>

  <div className="row g-3 align-items-end">
    {/* General Search */}
    <div className="col-lg-3 col-md-6">
      <label className="form-label font-monospace text-secondary small">
        General Search
      </label>
      <input
        type="text"
        className="form-control"
        placeholder="Search Event, Place or Particulars..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>

    {/* Event Name */}
    <div className="col-lg-2 col-md-6">
      <label className="form-label font-monospace text-secondary small">
        Event Name
      </label>
      <input
        type="text"
        className="form-control"
        placeholder="e.g. kyndryl"
        value={filterEventName}
        onChange={(e) => setFilterEventName(e.target.value)}
      />
    </div>

    {/* Event Place */}
    <div className="col-lg-2 col-md-6">
      <label className="form-label font-monospace text-secondary small">
        Event Place
      </label>
      <input
        type="text"
        className="form-control"
        placeholder="e.g. goa"
        value={filterEventPlace}
        onChange={(e) => setFilterEventPlace(e.target.value)}
      />
    </div>

    {/* From Date */}
    <div className="col-lg-2 col-md-6">
      <label className="form-label font-monospace text-secondary small">
        From Date
      </label>
      <input
        type="date"
        className="form-control"
        value={filterStartDate}
        onChange={(e) => setFilterStartDate(e.target.value)}
      />
    </div>

    {/* To Date */}
    <div className="col-lg-2 col-md-6">
      <label className="form-label font-monospace text-secondary small">
        To Date
      </label>
      <input
        type="date"
        className="form-control"
        value={filterEndDate}
        onChange={(e) => setFilterEndDate(e.target.value)}
      />
    </div>

    {/* Clear Button */}
    <div className="col-lg-1 col-md-12 d-flex justify-content-lg-end">
      <button
        className="btn btn-outline-secondary w-100"
        onClick={handleResetFilters}
      >
        Clear
      </button>
    </div>
  </div>
</div>
              </div>

              {/* History Table */}
              <div className="col-12">
                <div className="card shadow-sm">
                
                  <div className="card-body p-0">
                    <div className="table-responsive border-0">
                      <table className="table table-hover align-middle mb-0">
                        <thead>
                          <tr>
                            <th>Event Name</th>
                            <th>Event Place</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Duration</th>
                            <th className="text-center" style={{ width: "160px" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEvents.map((event) => (
                            <tr key={event._id}>
                              <td className="fw-bold">{event.eventName || event.event_name}</td>
                              <td>{event.eventPlace || event.location}</td>
                              <td className="font-monospace">{event.startDate || event.start_date}</td>
                              <td className="font-monospace">{event.endDate || event.end_date}</td>
                              <td>
                                <span className="badge bg-dark text-white font-monospace">
                                  {event.days || 0} {event.days === 1 ? "day" : "days"}
                                </span>
                              </td>
                              <td className="text-center">
                                <button
                                  className="btn btn-sm btn-warning me-2"
                                  onClick={() => handleEditClick(event)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDelete(event._id)}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          ))}
                          {filteredEvents.length === 0 && (
                            <tr>
                              <td colSpan="6" className="text-center py-5 text-muted">
                                No events registered for this employee matching the filters.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Event Modal */}
      {showEditModal && (
        <div
          className="modal show d-block fade-in"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(8, 12, 20, 0.75)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-secondary-subtle">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">📝 Edit Event Details</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowEditModal(false)}
                ></button>
              </div>
              <form onSubmit={handleEditSubmit}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label font-monospace text-secondary small">Event Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={editEventData.eventName}
                      onChange={(e) =>
                        setEditEventData({ ...editEventData, eventName: e.target.value })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label font-monospace text-secondary small">Particulars / Services Selected</label>
                    <SearchableSelect
                      options={particularsList}
                      value={editEventData.particulars}
                      onChange={(val) => setEditEventData({ ...editEventData, particulars: val })}
                      onRefresh={fetchParticulars}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label font-monospace text-secondary small">Event Place</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      value={editEventData.eventPlace}
                      onChange={(e) =>
                        setEditEventData({ ...editEventData, eventPlace: e.target.value })
                      }
                    />
                  </div>

                  <div className="row g-2">
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-monospace text-secondary small">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={editEventData.startDate}
                        onChange={(e) =>
                          setEditEventData({ ...editEventData, startDate: e.target.value })
                        }
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label font-monospace text-secondary small">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        required
                        value={editEventData.endDate}
                        onChange={(e) =>
                          setEditEventData({ ...editEventData, endDate: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary px-3"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEmployeeHistory;
