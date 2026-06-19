import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    document.body.classList.remove("sidebar-open");
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const toggleSidebar = () => {
    document.body.classList.toggle("sidebar-open");
  };

  return (
    <nav 
      className="navbar navbar-light py-3 px-4 border-bottom"
      style={{
        background: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderColor: "rgba(15, 23, 42, 0.08)",
        zIndex: 1050,
      }}
    >
      <div className="container-fluid p-0 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-3">
          {/* Hamburger button visible only on mobile */}
          <button 
            className="btn btn-light p-2 d-md-none border"
            onClick={toggleSidebar}
            aria-label="Toggle Navigation"
            style={{ borderRadius: "8px" }}
          >
            <span className="navbar-toggler-icon" style={{ width: "1.25em", height: "1.25em" }}></span>
          </button>
          
          <a className="navbar-brand m-0 fw-extrabold d-flex align-items-center" href="/admin/dashboard" style={{ letterSpacing: "-0.5px" }}>
            <span 
              style={{
                background: "var(--primary-grad)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "1.45rem",
                fontWeight: 800
              }}
            >
              BPPL Events
            </span>
            <span className="badge bg-secondary ms-2 text-xs font-monospace py-1 px-2" style={{ fontSize: "0.65rem", background: "rgba(15,23,42,0.06)", color: "#475569" }}>ADMIN</span>
          </a>
        </div>
        
        <div className="d-flex align-items-center gap-3">
          <span className="text-secondary d-none d-sm-inline font-monospace" style={{ fontSize: "0.85rem" }}>
            Signed in as: <strong className="text-dark">Admin</strong>
          </span>
          <button 
            onClick={handleLogout} 
            className="btn btn-danger btn-sm px-3"
            style={{ padding: "0.45rem 1rem !important", fontSize: "0.85rem" }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
