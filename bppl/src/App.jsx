import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeForm from "./pages/EmployeeForm";
import AdminEmployees from "./pages/AdminEmployees";
import AdminEvents from "./pages/AdminEvents";
import AdminEmployeeHistory from "./pages/AdminEmployeeHistory";
import AdminServices from "./pages/AdminServices";
import AdminInvoices from "./pages/AdminInvoices";
import AdminQuotations from "./pages/AdminQuotations";
import AdminProformas from "./pages/AdminProformas";
import AdminCreditNotes from "./pages/AdminCreditNotes";
import AdminDebitNotes from "./pages/AdminDebitNotes";
import AdminClients from "./pages/AdminClients";

// Protected Route Component (Step 3/4)
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("adminToken");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/employee" element={<EmployeeForm />} />
        <Route path="/login" element={<Login />} />
        
        {/* Protected Admin Routes */}
        <Route 
          path="/admin/dashboard" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/employees" 
          element={<ProtectedRoute><AdminEmployees /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/events" 
          element={<ProtectedRoute><AdminEvents /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/employee/:id" 
          element={<ProtectedRoute><AdminEmployeeHistory /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/services" 
          element={<ProtectedRoute><AdminServices /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/invoices" 
          element={<ProtectedRoute><AdminInvoices /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/quotations" 
          element={<ProtectedRoute><AdminQuotations /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/proformas" 
          element={<ProtectedRoute><AdminProformas /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/credit-notes" 
          element={<ProtectedRoute><AdminCreditNotes /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/debit-notes" 
          element={<ProtectedRoute><AdminDebitNotes /></ProtectedRoute>} 
        />
        <Route 
          path="/admin/clients" 
          element={<ProtectedRoute><AdminClients /></ProtectedRoute>} 
        />
        
        {/* Default redirect based on auth status */}
        <Route 
          path="*" 
          element={
            localStorage.getItem("adminToken") ? 
            <Navigate to="/admin/dashboard" replace /> : 
            <Navigate to="/employee" replace />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
