import { useState, useEffect } from "react";
import { getEmployees, createEmployee, deleteEmployee } from "../services/api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [newEmp, setNewEmp] = useState({ name: "", employeeId: "", email: "", department: "" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const res = await getEmployees();
      setEmployees(res.data);
    } catch (e) { 
      console.error(e); 
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await createEmployee(newEmp);
      setNewEmp({ name: "", employeeId: "", email: "", department: "" });
      loadEmployees();
    } catch (e) {
      alert("Error adding employee: " + (e.response?.data?.detail || e.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this employee?")) {
      try {
        await deleteEmployee(id);
        loadEmployees();
      } catch (e) { 
        console.error(e); 
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
            <h2 className="fw-extrabold m-0" style={{ letterSpacing: "-1px" }}>Manage Employees</h2>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadEmployees}>
              Refresh
            </button>
          </div>

          {/* Add Employee Form */}
          <div className="card p-4 mb-4 shadow-sm">
            <h5 className="fw-bold mb-3">Add New Employee</h5>
            <form onSubmit={handleAdd} className="row g-3 align-items-end">
              <div className="col-12 col-md-3">
                <label className="form-label font-monospace text-secondary small">Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Full Name" 
                  required 
                  value={newEmp.name} 
                  onChange={e=>setNewEmp({...newEmp, name: e.target.value})} 
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label font-monospace text-secondary small">Employee ID</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="ID (e.g. EMP102)" 
                  required 
                  value={newEmp.employeeId} 
                  onChange={e=>setNewEmp({...newEmp, employeeId: e.target.value})} 
                />
              </div>
              <div className="col-12 col-md-3">
                <label className="form-label font-monospace text-secondary small">Email (Optional)</label>
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="name@company.com" 
                  value={newEmp.email} 
                  onChange={e=>setNewEmp({...newEmp, email: e.target.value})} 
                />
              </div>
              <div className="col-12 col-md-2">
                <label className="form-label font-monospace text-secondary small">Department (Optional)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Engineering" 
                  value={newEmp.department} 
                  onChange={e=>setNewEmp({...newEmp, department: e.target.value})} 
                />
              </div>
              <div className="col-12 col-md-1">
                <button type="submit" className="btn btn-primary w-100 py-2">Add</button>
              </div>
            </form>
          </div>
          
          {/* Employee Directory Table */}
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
                      <th>Name</th>
                      <th>ID</th>
                      <th>Email</th>
                      <th>Department</th>
                      <th className="text-center" style={{ width: "200px" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp._id}>
                        <td className="fw-bold">{emp.name}</td>
                        <td>
                          <span className="badge bg-secondary font-monospace">
                            {emp.employeeId}
                          </span>
                        </td>
                        <td>{emp.email || <em className="text-muted">No email</em>}</td>
                        <td>{emp.department || <em className="text-muted">Unassigned</em>}</td>
                        <td className="text-center">
                          <button 
                            className="btn btn-sm btn-danger me-2" 
                            onClick={() => handleDelete(emp._id)}
                          >
                            Delete
                          </button>
                          <a 
                            href={`/admin/employee/${emp.employeeId}`} 
                            className="btn btn-sm btn-info"
                          >
                            History
                          </a>
                        </td>
                      </tr>
                    ))}
                    {employees.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No employees registered. Use the form above to add one.
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

export default AdminEmployees;
