import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminLogin } from "../services/api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const response = await adminLogin({ username, password });
      if (response.data.success) {
        localStorage.setItem("adminToken", response.data.token);
        navigate("/admin/dashboard");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail || "Invalid credentials or server error"
      );
    }
  };

  return (
    <div 
      className="d-flex justify-content-center align-items-center vh-100 px-3"
      style={{
        background: "radial-gradient(circle at 10% 20%, #eff6ff 0%, #f1f5f9 90%)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Decorative blurred glowing circles in background */}
      <div 
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          background: "var(--primary-grad)",
          borderRadius: "50%",
          filter: "blur(80px)",
          top: "-50px",
          right: "-50px",
          opacity: 0.08
        }}
      />
      <div 
        style={{
          position: "absolute",
          width: "350px",
          height: "350px",
          background: "var(--accent-grad)",
          borderRadius: "50%",
          filter: "blur(100px)",
          bottom: "-50px",
          left: "-100px",
          opacity: 0.08
        }}
      />

      <div className="card p-4 p-sm-5 fade-in" style={{ width: "420px", zIndex: 10 }}>
        <div className="text-center mb-4">
          <h2 className="fw-extrabold mb-1" style={{
            letterSpacing: "-1px",
            background: "var(--primary-grad)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}>Admin Portal</h2>
          <p className="text-muted small">Sign in to manage employees and event databases</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 px-3 mb-4 text-xs rounded-3 border-0 bg-danger bg-opacity-10 text-danger" style={{ fontSize: "0.85rem" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label font-monospace text-secondary small">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter admin username"
              required
            />
          </div>
          <div className="mb-4">
            <label className="form-label font-monospace text-secondary small">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100 py-3 mt-2">
            Sign In
          </button>
        </form>

        <div className="text-center mt-4 pt-2 border-top border-secondary-subtle">
          <a href="/employee" className="text-secondary text-decoration-none small hover-underline" style={{ transition: "color 0.2s" }} onMouseEnter={(e)=>e.target.style.color="var(--text-primary)"} onMouseLeave={(e)=>e.target.style.color="var(--text-muted)"}>
            &larr; Switch to Employee Form
          </a>
        </div>
      </div>
    </div>
  );
}

export default Login;
