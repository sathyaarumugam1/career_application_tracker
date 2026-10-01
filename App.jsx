import { useEffect, useMemo, useState } from "react";

const API_URL = "http://localhost:5000/api/applications";

const EMPTY_FORM = {
  company: "",
  role: "",
  type: "Full-time",
  location: "",
  status: "Applied",
  appliedDate: new Date().toISOString().split("T")[0],
  notes: "",
};

function App() {
  const [applications, setApplications] = useState([]);
  const [page, setPage] = useState("Dashboard");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  };

  useEffect(() => {
    fetch(API_URL)
      .then((res) => {
        if (!res.ok) throw new Error("Backend error");
        return res.json();
      })
      .then((data) => setApplications(data))
      .catch(() => notify("Backend is not connected"))
      .finally(() => setLoading(false));
  }, []);

  const addApplication = async (e) => {
    e.preventDefault();

    if (!form.company.trim() || !form.role.trim()) {
      notify("Company and role are required");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to add application");
      }

      setApplications((prev) => [...prev, data]);
      setForm(EMPTY_FORM);
      setShowModal(false);
      notify("Application added successfully");
    } catch (error) {
      notify(error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error();

      setApplications((prev) =>
        prev.map((item) => (item.id === id ? data : item))
      );

      notify("Status updated");
    } catch {
      notify("Unable to update status");
    }
  };

  const deleteApplication = async (id) => {
    if (!window.confirm("Delete this application?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error();

      setApplications((prev) => prev.filter((item) => item.id !== id));
      notify("Application deleted");
    } catch {
      notify("Unable to delete application");
    }
  };

  const stats = useMemo(
    () => ({
      total: applications.length,
      applied: applications.filter((a) => a.status === "Applied").length,
      interview: applications.filter((a) => a.status === "Interview").length,
      offer: applications.filter((a) => a.status === "Offer").length,
    }),
    [applications]
  );

  const filteredApplications = useMemo(() => {
    return applications
      .filter((item) => {
        const text =
          `${item.company} ${item.role} ${item.location}`.toLowerCase();

        return (
          text.includes(search.toLowerCase()) &&
          (filter === "All" || item.status === filter)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.appliedDate).getTime() -
          new Date(a.appliedDate).getTime()
      );
  }, [applications, search, filter]);

  return (
    <div className="app">
      <aside className="sidebar">
        <div>
          <div className="brand">
            <div className="brand-logo">C</div>

            <div>
              <h2>CareerTrack</h2>
              <p>Career workspace</p>
            </div>
          </div>

          <div className="nav-label">WORKSPACE</div>

          <button
            className={`nav-item ${page === "Dashboard" ? "active" : ""}`}
            onClick={() => setPage("Dashboard")}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            className={`nav-item ${
              page === "Applications" ? "active" : ""
            }`}
            onClick={() => setPage("Applications")}
          >
            <span>▣</span>
            Applications
            <b>{applications.length}</b>
          </button>
        </div>

        <div className="sidebar-progress">
          <p>APPLICATIONS TRACKED</p>
          <strong>{applications.length}</strong>

          <div className="progress">
            <div
              style={{
                width: `${Math.min(applications.length * 15, 100)}%`,
              }}
            />
          </div>

          <small>Keep moving forward.</small>
        </div>
      </aside>

      <main className="main">
        {page === "Dashboard" ? (
          <>
            <header className="hero">
              <div>
                <div className="eyebrow">CAREER DASHBOARD</div>

                <h1>
                  Track applications.
                  <br />
                  <span>Move your career forward.</span>
                </h1>

                <p>
                  Organize your job applications, interviews and offers in one
                  simple workspace.
                </p>
              </div>

              <button
                className="primary"
                onClick={() => setShowModal(true)}
              >
                + Add application
              </button>
            </header>

            <div className="stats">
              <Stat
                title="Total applications"
                value={stats.total}
                icon="▣"
              />
              <Stat title="Applied" value={stats.applied} icon="↗" />
              <Stat
                title="Interviews"
                value={stats.interview}
                icon="◉"
              />
              <Stat title="Offers" value={stats.offer} icon="★" />
            </div>

            <section className="section">
              <div className="section-heading">
                <div>
                  <div className="eyebrow">RECENT ACTIVITY</div>
                  <h2>Latest applications</h2>
                </div>

                <button
                  className="view-button"
                  onClick={() => setPage("Applications")}
                >
                  View all →
                </button>
              </div>

              {loading ? (
                <Loading />
              ) : filteredApplications.length === 0 ? (
                <EmptyState onAdd={() => setShowModal(true)} />
              ) : (
                <div className="applications">
                  {filteredApplications.slice(0, 5).map((item) => (
                    <ApplicationCard
                      key={item.id}
                      item={item}
                      onStatus={updateStatus}
                      onDelete={deleteApplication}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <>
            <header className="page-header">
              <div>
                <div className="eyebrow">APPLICATION MANAGEMENT</div>
                <h1>Applications</h1>
                <p>Manage every opportunity from one place.</p>
              </div>

              <button
                className="primary"
                onClick={() => setShowModal(true)}
              >
                + Add application
              </button>
            </header>

            <div className="toolbar">
              <div className="search">
                <span>⌕</span>

                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search company, role or location..."
                />
              </div>

              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="All">All statuses</option>
                <option value="Applied">Applied</option>
                <option value="Interview">Interview</option>
                <option value="Offer">Offer</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            {loading ? (
              <Loading />
            ) : filteredApplications.length === 0 ? (
              <EmptyState onAdd={() => setShowModal(true)} />
            ) : (
              <div className="applications">
                {filteredApplications.map((item) => (
                  <ApplicationCard
                    key={item.id}
                    item={item}
                    onStatus={updateStatus}
                    onDelete={deleteApplication}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div>
                <div className="eyebrow">NEW APPLICATION</div>
                <h2>Track a new opportunity</h2>
                <p>Add your application details below.</p>
              </div>

              <button
                className="close"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={addApplication}>
              <div className="form-grid">
                <Field
                  label="Company"
                  placeholder="e.g. Infosys"
                  value={form.company}
                  onChange={(value) =>
                    setForm({ ...form, company: value })
                  }
                />

                <Field
                  label="Role"
                  placeholder="e.g. Software Engineer"
                  value={form.role}
                  onChange={(value) =>
                    setForm({ ...form, role: value })
                  }
                />

                <SelectField
                  label="Employment type"
                  value={form.type}
                  options={[
                    "Full-time",
                    "Internship",
                    "Part-time",
                    "Contract",
                  ]}
                  onChange={(value) =>
                    setForm({ ...form, type: value })
                  }
                />

                <Field
                  label="Location"
                  placeholder="e.g. Chennai / Remote"
                  value={form.location}
                  onChange={(value) =>
                    setForm({ ...form, location: value })
                  }
                />

                <SelectField
                  label="Status"
                  value={form.status}
                  options={[
                    "Applied",
                    "Interview",
                    "Offer",
                    "Rejected",
                  ]}
                  onChange={(value) =>
                    setForm({ ...form, status: value })
                  }
                />

                <Field
                  label="Applied date"
                  type="date"
                  value={form.appliedDate}
                  onChange={(value) =>
                    setForm({ ...form, appliedDate: value })
                  }
                />

                <div className="field full">
                  <label>Notes</label>

                  <textarea
                    rows="4"
                    placeholder="Interview details, recruiter notes..."
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button className="primary" disabled={saving}>
                  {saving ? "Saving..." : "Add application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>

      <div>
        <p>{title}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

function Field({ label, placeholder, value, onChange, type = "text" }) {
  return (
    <div className="field">
      <label>{label}</label>

      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="field">
      <label>{label}</label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function ApplicationCard({ item, onStatus, onDelete }) {
  const initial = item.company?.charAt(0).toUpperCase() || "?";

  const date = item.appliedDate
    ? new Date(item.appliedDate).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <article className="application-card">
      <div className="company-logo">{initial}</div>

      <div className="company-info">
        <h3>{item.company}</h3>
        <p>{item.location || "Location not specified"}</p>
      </div>

      <div className="role-info">
        <h3>{item.role}</h3>

        <div>
          <span>{item.type}</span>
          <span>Applied {date}</span>
        </div>
      </div>

      <div className="status-area">
        <select
          value={item.status}
          onChange={(e) => onStatus(item.id, e.target.value)}
        >
          <option>Applied</option>
          <option>Interview</option>
          <option>Offer</option>
          <option>Rejected</option>
        </select>

        <span className={`status ${item.status.toLowerCase()}`}>
          {item.status}
        </span>
      </div>

      <button
        className="delete"
        onClick={() => onDelete(item.id)}
      >
        ×
      </button>
    </article>
  );
}

function Loading() {
  return (
    <div className="empty">
      <div className="spinner" />
      <p>Loading applications...</p>
    </div>
  );
}

function EmptyState({ onAdd }) {
  return (
    <div className="empty">
      <div className="empty-icon">+</div>

      <h3>No applications yet</h3>

      <p>Start tracking your job search by adding your first application.</p>

      <button className="primary" onClick={onAdd}>
        + Add application
      </button>
    </div>
  );
}

export default App;