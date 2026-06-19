import { useState, useRef, useEffect } from "react";
import { createParticular } from "../services/api";

const CATEGORIES = [
  "Photo Booths",
  "Games",
  "Drones 500grm",
  "Robots",
  "Hologram fan",
  "Sensors Activities & IOT devices",
  "Web Applications SDK",
  "Workshop & Fun",
  "Printers",
  "Casting",
  "Projection",
  "Other"
];

function SearchableSelect({ options, value, onChange, onRefresh, required }) {
  const isAdmin = !!localStorage.getItem("adminToken");
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceCategory, setNewServiceCategory] = useState(CATEGORIES[0]);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const containerRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search query
  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(search.toLowerCase())
  );

  // Group filtered options by category
  const grouped = filteredOptions.reduce((acc, opt) => {
    const cat = opt.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(opt);
    return acc;
  }, {});

  // Check if current search string has an exact match
  const hasExactMatch = options.some(
    (opt) => opt.name.toLowerCase() === search.trim().toLowerCase()
  );

  const handleSelect = (name) => {
    onChange(name);
    setIsOpen(false);
    setSearch("");
  };

  const handleOpenAddModal = (nameVal) => {
    setNewServiceName(nameVal || search || "");
    setNewServiceCategory(CATEGORIES[0]);
    setErrorMsg("");
    setShowAddModal(true);
    setIsOpen(false);
  };

  const handleAddSubmit = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }
    if (!newServiceName.trim()) return;

    setIsSaving(true);
    setErrorMsg("");
    try {
      const response = await createParticular({
        name: newServiceName.trim(),
        category: newServiceCategory
      });
      // Trigger refresh of list in parent
      if (onRefresh) {
        await onRefresh();
      }
      // Select the newly created service
      onChange(response.data.name);
      setShowAddModal(false);
      setSearch("");
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to add service");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="position-relative" ref={containerRef}>
      <div className="input-group">
        <div 
          className="form-control d-flex justify-content-between align-items-center cursor-pointer"
          style={{ cursor: "pointer", minHeight: "45px" }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className={value ? "text-dark" : "text-muted"}>
            {value || "Select Particular / Service"}
          </span>
          <span className="small text-secondary">▼</span>
        </div>
        {isAdmin && (
          <button 
            type="button" 
            className="btn btn-outline-primary px-3 d-flex align-items-center"
            title="Add New Particular"
            onClick={() => handleOpenAddModal("")}
          >
            <strong style={{ fontSize: "1.2rem", lineHeight: "1" }}>+</strong>
          </button>
        )}
      </div>

      {/* Hidden input for HTML5 form validation if required */}
      {required && (
        <input 
          type="text" 
          value={value} 
          required 
          style={{ opacity: 0.01, height: "1px", width: "1px", position: "absolute", bottom: 0, left: "50%", pointerEvents: "none", border: "none", padding: 0 }} 
          onChange={() => {}}
        />
      )}

      {isOpen && (
        <div 
          className="card shadow-lg position-absolute w-100 mt-1 p-2" 
          style={{ 
            zIndex: 1050, 
            maxHeight: "350px", 
            overflowY: "auto", 
            backgroundColor: "#ffffff",
            border: "1px solid rgba(30, 58, 138, 0.15)"
          }}
        >
          <div className="mb-2">
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ maxHeight: "250px", overflowY: "auto" }}>
            {Object.keys(grouped).length > 0 ? (
              Object.keys(grouped).map((cat) => (
                <div key={cat} className="mb-2">
                  <div className="text-secondary small font-monospace fw-bold px-2 py-1 bg-light rounded">
                    {cat}
                  </div>
                  {grouped[cat].map((opt) => (
                    <div
                      key={opt._id || opt.name}
                      className="px-3 py-2 cursor-pointer rounded text-secondary small select-option-item"
                      style={{ cursor: "pointer", transition: "background 0.2s" }}
                      onClick={() => handleSelect(opt.name)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = "rgba(37, 99, 235, 0.08)"}
                      onMouseLeave={(e) => e.target.style.backgroundColor = "transparent"}
                    >
                      {opt.name}
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-muted small text-center py-2">
                No services found matching "{search}"
              </div>
            )}
          </div>

          {isAdmin && search.trim() && !hasExactMatch && (
            <div className="border-top pt-2 mt-2">
              <button
                type="button"
                className="btn btn-primary btn-sm w-100 text-white"
                onClick={() => handleOpenAddModal(search)}
              >
                ➕ Add "{search}" as new service
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Particular Modal */}
      {showAddModal && (
        <div
          className="modal show d-block fade-in"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(8, 12, 20, 0.75)", zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-secondary-subtle">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">✨ Add New Particular / Service</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div>
                <div className="modal-body p-4">
                  {errorMsg && (
                    <div className="alert alert-danger py-2 px-3 small border-0 mb-3">
                      ⚠️ {errorMsg}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label font-monospace text-secondary small">Service Name</label>
                    <input
                      type="text"
                      className="form-control"
                      required
                      placeholder="e.g. Interactive AI Mirror"
                      value={newServiceName}
                      onChange={(e) => setNewServiceName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubmit();
                        }
                      }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label font-monospace text-secondary small">Category</label>
                    <select
                      className="form-select"
                      required
                      value={newServiceCategory}
                      onChange={(e) => setNewServiceCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSubmit();
                        }
                      }}
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary px-3"
                    onClick={() => setShowAddModal(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary px-4" 
                    disabled={isSaving}
                    onClick={handleAddSubmit}
                  >
                    {isSaving ? "Saving..." : "Save Particular"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchableSelect;
