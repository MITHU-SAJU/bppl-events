import { Link, useLocation } from "react-router-dom";

function Sidebar() {
  const location = useLocation();

  const handleLinkClick = () => {
    // Auto-close sidebar on link selection (mobile)
    document.body.classList.remove("sidebar-open");
  };

  return (
    <div className="sidebar-container">
      <div className="list-group list-group-flush mt-4">
        <Link
          to="/admin/dashboard"
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/dashboard" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>📊</span> Dashboard
        </Link>
        <Link 
          to="/admin/events" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/events" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>📅</span> Events
        </Link>
        <Link 
          to="/admin/employees" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/employees" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>👥</span> Employees
        </Link>
        <Link 
          to="/admin/services" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/services" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>🛠️</span> Services
        </Link>
         <Link 
          to="/admin/clients" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/clients" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>👤</span> Clients
        </Link>
         <Link 
          to="/admin/quotations" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/quotations" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>📄</span> Quotations
        </Link>
        <Link 
          to="/admin/proformas" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/proformas" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>📑</span> Proformas
        </Link>
        <Link 
          to="/admin/invoices" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/invoices" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>🧾</span> Invoices
        </Link>
       
        <Link 
          to="/admin/credit-notes" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/credit-notes" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>📉</span> Credit Notes
        </Link>
        <Link 
          to="/admin/debit-notes" 
          onClick={handleLinkClick}
          className={`list-group-item list-group-item-action ${
            location.pathname === "/admin/debit-notes" ? "active" : ""
          }`}
        >
          <span style={{ fontSize: "1.1rem" }}>📈</span> Debit Notes
        </Link>
       
      </div>
    </div>
  );
}

export default Sidebar;
