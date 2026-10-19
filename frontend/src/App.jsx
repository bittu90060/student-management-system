
import { useEffect, useMemo, useState } from "react";
import {
  GraduationCap, LayoutDashboard, Users, BookOpen, Settings, Search,
  Plus, Download, Pencil, Trash2, X, Menu, Mail, Phone, CalendarDays,
  UserRound, ChevronDown, CheckCircle2, CircleAlert, Filter
} from "lucide-react";
import "./App.css";

const API_URL = "https://student-management-system-npd9.onrender.com/api/students";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  className: "Class 10",
  section: "A",
  gender: "Male",
  joined: new Date().toISOString().slice(0, 10),
};

function normalizeStudent(student) {
  return {
    ...student,
    id: student._id || student.id,
    displayId: student._id
      ? `STU-${String(student._id).slice(-6).toUpperCase()}`
      : student.displayId || student.id,
  };
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || data.error || `Request failed (${response.status})`
    );
  }

  return data;
}

function App() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState("");

  // Load students from MongoDB through the backend API
  async function loadStudents() {
    try {
      setLoading(true);
      setApiError("");

      const data = await apiRequest(API_URL);

      if (!Array.isArray(data)) {
        throw new Error("Invalid response from students API.");
      }

      setStudents(data.map(normalizeStudent));
    } catch (error) {
      setApiError(error.message || "Unable to load students.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (!notice) return;

    const timer = setTimeout(() => setNotice(""), 3200);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesQuery =
        !query ||
        [
          student.name,
          student.email,
          student.phone,
          student.id,
          student.displayId,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const matchesClass =
        classFilter === "All Classes" ||
        student.className === classFilter;

      return matchesQuery && matchesClass;
    });
  }, [students, search, classFilter]);

  const classes = useMemo(
    () => [
      "All Classes",
      ...new Set(students.map((student) => student.className).filter(Boolean)),
    ],
    [students]
  );

  const activeStudents = students.length;
  const femaleStudents = students.filter(
    (student) => student.gender === "Female"
  ).length;
  const classCount = new Set(
    students.map((student) => student.className).filter(Boolean)
  ).size;

  function openAddModal() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      joined: new Date().toISOString().slice(0, 10),
    });
    setFormError("");
    setModalOpen(true);
  }

  function openEditModal(student) {
    setEditingId(student.id);

    setForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      className: student.className || "Class 10",
      section: student.section || "A",
      gender: student.gender || "Male",
      joined: student.joined || "",
    });

    setFormError("");
    setModalOpen(true);
  }

  // Add or update a student in MongoDB
  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.phone.trim()
    ) {
      setFormError(
        "Please fill in the student name, email and phone number."
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError("Please enter a valid email address.");
      return;
    }

    if (!/^[0-9+\-\s()]{7,16}$/.test(form.phone.trim())) {
      setFormError("Please enter a valid phone number.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
    };

    try {
      setSaving(true);
      setApiError("");

      if (editingId) {
        const result = await apiRequest(
          `${API_URL}/${editingId}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );

        const updated = normalizeStudent(
          result.student || result
        );

        setStudents((current) =>
          current.map((student) =>
            student.id === editingId ? updated : student
          )
        );

        setNotice("Student details updated successfully.");
      } else {
        const result = await apiRequest(API_URL, {
          method: "POST",
          body: JSON.stringify(payload),
        });

        const created = normalizeStudent(
          result.student || result
        );

        setStudents((current) => [created, ...current]);
        setNotice("Student added successfully.");
      }

      setModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    } catch (error) {
      setFormError(error.message || "Unable to save student.");
    } finally {
      setSaving(false);
    }
  }

  // Delete a student from MongoDB
  async function deleteStudent(student) {
    if (
      !window.confirm(
        `Delete ${student.name}'s record? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setApiError("");

      await apiRequest(`${API_URL}/${student.id}`, {
        method: "DELETE",
      });

      setStudents((current) =>
        current.filter((item) => item.id !== student.id)
      );

      setNotice("Student record deleted successfully.");
    } catch (error) {
      setApiError(error.message || "Unable to delete student.");
    }
  }

  function exportCsv() {
    const headers = [
      "Student ID",
      "Name",
      "Email",
      "Phone",
      "Class",
      "Section",
      "Gender",
      "Admission Date",
    ];

    const rows = filteredStudents.map((student) => [
      student.displayId,
      student.name,
      student.email,
      student.phone,
      student.className,
      student.section,
      student.gender,
      student.joined,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "student-records.csv";
    link.click();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice("Student records exported as CSV.");
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="mobile-scrim"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark">
            <GraduationCap size={23} />
          </div>

          <div>
            <strong>EduManage</strong>
            <span>STUDENT PORTAL</span>
          </div>

          <button
            className="icon-button sidebar-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="side-label">WORKSPACE</div>

        <nav className="side-nav">
          <button className="nav-item active">
            <LayoutDashboard size={18} /> Dashboard
          </button>

          <button className="nav-item">
            <Users size={18} /> Students
            <span className="nav-count">{students.length}</span>
          </button>

          <button className="nav-item">
            <BookOpen size={18} /> Classes
          </button>

          <button className="nav-item">
            <Settings size={18} /> Settings
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <GraduationCap size={20} />
            </div>
            <strong>Need a hand?</strong>
            <p>Keep student records organized in one place.</p>
          </div>

          <div className="profile-mini">
            <div className="admin-avatar">A</div>
            <div className="profile-info">
              <strong>Admin User</strong>
              <span>Administrator</span>
            </div>
            <ChevronDown size={16} />
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="crumb-slash">/</span>
            <strong>Student Management</strong>
          </div>

          <div className="topbar-right">
            <span className="today-label">
              <CalendarDays size={15} /> Academic Year 2026–27
            </span>
            <div className="top-avatar">A</div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                OVERVIEW <span>•</span> STUDENT DIRECTORY
              </div>
              <h1>Student Management</h1>
              <p>
                Manage student records, classes, and personal information.
              </p>
            </div>

            <button
              className="primary-button"
              onClick={openAddModal}
            >
              <Plus size={18} /> Add Student
            </button>
          </div>

          {apiError && (
            <div className="form-error" role="alert">
              <CircleAlert size={16} />
              <span>{apiError}</span>
              <button
                className="secondary-button"
                onClick={loadStudents}
                disabled={loading}
              >
                Retry
              </button>
            </div>
          )}

          <div className="stats-grid">
            <StatCard
              icon={<Users size={21} />}
              color="blue"
              label="Total Students"
              value={activeStudents}
              foot="Records in database"
            />

            <StatCard
              icon={<UserRound size={21} />}
              color="green"
              label="Female Students"
              value={femaleStudents}
              foot={
                activeStudents
                  ? `${Math.round(
                      (femaleStudents / activeStudents) * 100
                    )}% of all students`
                  : "No records yet"
              }
            />

            <StatCard
              icon={<BookOpen size={21} />}
              color="purple"
              label="Classes Covered"
              value={classCount}
              foot="Classes with student records"
            />

            <StatCard
              icon={<CheckCircle2 size={21} />}
              color="orange"
              label="Records Status"
              value={loading ? "Loading" : apiError ? "Error" : "Connected"}
              foot="MongoDB-backed records"
            />
          </div>

          <section className="content-card">
            <div className="card-heading">
              <div>
                <h2>Student Directory</h2>
                <p>View and manage all registered students.</p>
              </div>

              <button
                className="secondary-button export-button"
                onClick={exportCsv}
                disabled={loading || filteredStudents.length === 0}
              >
                <Download size={17} /> Export CSV
              </button>
            </div>

            <div className="toolbar">
              <div className="search-box">
                <Search size={18} />

                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, ID, email or phone..."
                  aria-label="Search students"
                />

                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={15} />
                  </button>
                )}
              </div>

              <label className="filter-box">
                <Filter size={16} />

                <select
                  value={classFilter}
                  onChange={(event) => setClassFilter(event.target.value)}
                  aria-label="Filter by class"
                >
                  {classes.map((className) => (
                    <option key={className} value={className}>
                      {className}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>STUDENT ID</th>
                    <th>CLASS</th>
                    <th>CONTACT</th>
                    <th>ADMISSION DATE</th>
                    <th>GENDER</th>
                    <th className="actions-heading">ACTIONS</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-state">
                          <strong>Loading students...</strong>
                          <p>Fetching records from the database.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.map((student, index) => (
                    <tr key={student.id}>
                      <td>
                        <div className="student-cell">
                          <div className={`student-avatar avatar-${index % 5}`}>
                            {initials(student.name)}
                          </div>

                          <div className="student-name">
                            <strong>{student.name}</strong>
                            <span>{student.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="student-id">
                          {student.displayId}
                        </span>
                      </td>

                      <td>
                        <span className="class-pill">
                          {student.className} <span>·</span>{" "}
                          {student.section}
                        </span>
                      </td>

                      <td>
                        <div className="contact-cell">
                          <span>
                            <Mail size={13} /> {student.email}
                          </span>
                          <span>
                            <Phone size={13} /> {student.phone}
                          </span>
                        </div>
                      </td>

                      <td className="date-cell">
                        {student.joined || "—"}
                      </td>

                      <td>
                        <span
                          className={`gender-pill ${
                            student.gender === "Female" ? "female" : "male"
                          }`}
                        >
                          {student.gender}
                        </span>
                      </td>

                      <td>
                        <div className="row-actions">
                          <button
                            className="action-button edit"
                            title="Edit student"
                            aria-label={`Edit ${student.name}`}
                            onClick={() => openEditModal(student)}
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            className="action-button delete"
                            title="Delete student"
                            aria-label={`Delete ${student.name}`}
                            onClick={() => deleteStudent(student)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!loading && filteredStudents.length === 0 && (
                    <tr>
                      <td colSpan="7">
                        <div className="empty-state">
                          <div><Search size={23} /></div>
                          <strong>No students found</strong>
                          <p>
                            {apiError
                              ? "Check your backend connection and retry."
                              : "Try a different search or add a new student record."}
                          </p>
                          <button
                            className="secondary-button"
                            onClick={() => {
                              setSearch("");
                              setClassFilter("All Classes");
                            }}
                          >
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>
                Showing <strong>{filteredStudents.length}</strong> of{" "}
                <strong>{students.length}</strong> students
              </span>

              <span className="footer-note">
                <CircleAlert size={14} /> Data loaded from MongoDB
              </span>
            </div>
          </section>

          <footer className="page-footer">
            © 2026 EduManage <span>•</span> Student Management System
            <span className="footer-right">Built with React + MongoDB</span>
          </footer>
        </section>
      </main>

      {notice && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} /> {notice}
        </div>
      )}

      {modalOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setModalOpen(false);
            }
          }}
        >
          <section
            className="student-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <div className="modal-header">
              <div>
                <span className="modal-kicker">
                  {editingId ? "UPDATE RECORD" : "NEW RECORD"}
                </span>
                <h2 id="modal-title">
                  {editingId ? "Edit Student" : "Add New Student"}
                </h2>
                <p>Enter the student’s details below.</p>
              </div>

              <button
                className="icon-button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label className="form-field full">
                  <span>Full name <b>*</b></span>
                  <input
                    autoFocus
                    required
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="e.g. Bittu Kumar"
                  />
                </label>

                <label className="form-field">
                  <span>Email address <b>*</b></span>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(event) =>
                      setForm({ ...form, email: event.target.value })
                    }
                    placeholder="student@example.com"
                  />
                </label>

                <label className="form-field">
                  <span>Phone number <b>*</b></span>
                  <input
                    type="tel"
                    required
                    value={form.phone}
                    onChange={(event) =>
                      setForm({ ...form, phone: event.target.value })
                    }
                    placeholder="Enter phone number"
                  />
                </label>

                <label className="form-field">
                  <span>Class</span>
                  <select
                    value={form.className}
                    onChange={(event) =>
                      setForm({ ...form, className: event.target.value })
                    }
                  >
                    {Array.from(
                      { length: 12 },
                      (_, index) => `Class ${index + 1}`
                    ).map((className) => (
                      <option key={className}>{className}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Section</span>
                  <select
                    value={form.section}
                    onChange={(event) =>
                      setForm({ ...form, section: event.target.value })
                    }
                  >
                    {["A", "B", "C", "D"].map((section) => (
                      <option key={section}>{section}</option>
                    ))}
                  </select>
                </label>

                <label className="form-field">
                  <span>Gender</span>
                  <select
                    value={form.gender}
                    onChange={(event) =>
                      setForm({ ...form, gender: event.target.value })
                    }
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </label>

                <label className="form-field">
                  <span>Admission date</span>
                  <input
                    type="date"
                    value={form.joined}
                    onChange={(event) =>
                      setForm({ ...form, joined: event.target.value })
                    }
                  />
                </label>
              </div>

              {formError && (
                <div className="form-error" role="alert">
                  <CircleAlert size={16} /> {formError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  disabled={saving}
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  <CheckCircle2 size={17} />
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Save Changes"
                      : "Add Student"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, color, label, value, foot }) {
  return (
    <article className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-foot">{foot}</div>
    </article>
  );
}

export default App;
