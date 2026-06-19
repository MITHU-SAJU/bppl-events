import { useEffect, useState } from "react";
import { getEvents, getEmployees, getParticulars } from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function Dashboard() {
  const [events, setEvents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [particulars, setParticulars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [eventsRes, employeesRes, particularsRes] = await Promise.all([
        getEvents(),
        getEmployees(),
        getParticulars()
      ]);
      setEvents(eventsRes.data);
      setEmployees(employeesRes.data);
      setParticulars(particularsRes.data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Sort events so that the newly added ones (latest insertion, i.e. highest ObjectId hex string or simply in reverse of insertion) come at the top.
  // Using reverse() since MongoDB collection finds elements in insertion order (oldest to newest).
  const recentEvents = [...events].reverse().slice(0, 5);

  return (
    <div className="d-flex flex-column vh-100">
      {/* Top Navbar */}
      <Navbar />

      <div className="d-flex flex-grow-1">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-grow-1 p-4 fade-in" style={{ overflowY: "auto" }}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="fw-extrabold m-0" style={{ letterSpacing: "-1px" }}>Admin Dashboard</h1>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadDashboardData}>
              Refresh Stats
            </button>
          </div>

          {loading ? (
            <div className="text-center my-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Stat Cards Grid */}
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-4">
                  <div 
                    className="card p-4 hover-lift h-100" 
                    style={{ borderLeft: "5px solid #1d4ed8" }}
                  >
                    <div className="text-secondary small font-monospace fw-bold">TOTAL EVENTS</div>
                    <h2 className="display-6 fw-extrabold mt-2 mb-0 text-primary">{events.length}</h2>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div 
                    className="card p-4 hover-lift h-100" 
                    style={{ borderLeft: "5px solid #0284c7" }}
                  >
                    <div className="text-secondary small font-monospace fw-bold">TOTAL EMPLOYEES</div>
                    <h2 className="display-6 fw-extrabold mt-2 mb-0 text-primary">
                      {employees.length}
                    </h2>
                  </div>
                </div>

                <div className="col-12 col-md-4">
                  <div 
                    className="card p-4 hover-lift h-100" 
                    style={{ borderLeft: "5px solid #06b6d4" }}
                  >
                    <div className="text-secondary small font-monospace fw-bold">TOTAL SERVICES</div>
                    <h2 className="display-6 fw-extrabold mt-2 mb-0 text-primary">
                      {particulars.length}
                    </h2>
                  </div>
                </div>
              </div>

              <hr className="my-4 border-secondary-subtle" />

              <h3 className="fw-extrabold mb-3" style={{ letterSpacing: "-0.5px" }}>Recent Records</h3>
          
              <div className="card-body p-0">
                <div className="table-responsive border-0">
                  <table className="table table-hover align-middle mb-0">
                    <thead>
                      <tr>
                        <th>Employee Name</th>
                        <th>Employee ID</th>
                        <th>Event Name</th>
                        <th>Particulars</th>
                        <th>Location</th>
                        <th className="text-end">Travel Days</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvents.map((event, index) => (
                        <tr key={event._id || index}>
                          <td className="fw-bold">{event.employeeName || event.employee_name}</td>
                          <td>
                            <span className="badge bg-secondary font-monospace">
                              {event.employeeId || event.employee_id}
                            </span>
                          </td>
                          <td>{event.eventName || event.event_name}</td>
                          <td>
                            {event.particulars ? (
                              <span className="badge bg-light text-primary border border-primary-subtle font-monospace text-none small">
                                {event.particulars}
                              </span>
                            ) : (
                              <em className="text-muted small">None</em>
                            )}
                          </td>
                          <td>{event.eventPlace || event.location}</td>
                          <td className="text-end font-monospace fw-bold text-primary">
                            {event.days || 0}
                          </td>
                        </tr>
                      ))}
                      {recentEvents.length === 0 && (
                        <tr>
                          <td colSpan="6" className="text-center py-5 text-muted">
                            No events registered in database.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
