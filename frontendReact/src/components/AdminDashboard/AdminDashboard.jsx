import { useState, useEffect } from "react";
import {
  BarChart,
  PieChart,
  Bar,
  Pie,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./AdminDashboard.css";

const dummyUsers = [
  { id: 1, name: "Alice", email: "alice@example.com", role: "Learner" },
  { id: 2, name: "Bob", email: "bob@example.com", role: "Mentor" },
  { id: 3, name: "Charlie", email: "charlie@example.com", role: "Admin" },
];

const dummyCourses = [
  { id: 1, title: "React Basics", description: "Learn the fundamentals of React." },
  { id: 2, title: "Advanced Node.js", description: "Deep dive into Node.js." },
];

const dummyJobs = [
  { id: 1, title: "Frontend Developer", company: "Tech Corp", location: "Remote" },
  { id: 2, title: "Backend Developer", company: "Dev Solutions", location: "Onsite" },
];

const dummyGroups = [
  { id: 1, name: "React Enthusiasts", members: 120 },
  { id: 2, name: "Node.js Developers", members: 80 },
];

const dummyEvents = [
  { id: 1, name: "React Conference", date: "2023-12-01" },
  { id: 2, name: "Node.js Meetup", date: "2023-11-15" },
];

const statsData = {
  users: {
    total: 345,
    roles: [
      { role: "Learner", count: 250 },
      { role: "Mentor", count: 80 },
      { role: "Admin", count: 15 },
    ],
  },
  courses: {
    total: 89,
    categories: [
      { name: "Technical", value: 60 },
      { name: "Business", value: 15 },
      { name: "Design", value: 10 },
      { name: "Other", value: 4 },
    ],
  },
  skills: {
    total: 45,
    trending: ["Design", "Development", "Full Stack", "Cybersecurity"],
  },
};

const SkillManager = () => {
  const [categories, setCategories] = useState([]);
  const [skills, setSkills] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    tags: "",
  });
  const [message, setMessage] = useState("");
  const [editingSkillId, setEditingSkillId] = useState(null);
  const [editingData, setEditingData] = useState({
    name: "",
    category: "",
    description: "",
    tags: "",
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch("http://localhost:5000/api/admin/skillCategories");
        const data = await response.json();
        setCategories(data);
        if (data.length > 0) {
          setFormData((prev) => ({ ...prev, category: data[0] }));
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const response = await fetch("http://localhost:5000/api/admin/skills");
        if (response.ok) {
          const data = await response.json();
          setSkills(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchSkills();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, category, description, tags } = formData;
    const tagsArray = tags.split(",").map((tag) => tag.trim()).filter((tag) => tag);
    try {
      const response = await fetch("http://localhost:5000/api/admin/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, category, description, tags: tagsArray }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage("Skill added successfully!");
        setSkills((prev) => [...prev, data]);
        setFormData({
          name: "",
          category: categories.length > 0 ? categories[0] : "",
          description: "",
          tags: "",
        });
      } else {
        setMessage(data.message || "Error adding skill.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Error adding skill.");
    }
  };

  const handleDeleteSkill = async (id) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/admin/skills/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setSkills((prev) => prev.filter((skill) => skill._id !== id));
        alert("Skill deleted successfully");
      } else {
        alert(data.message || "Error deleting skill");
      }
    } catch (error) {
      console.error(error);
      alert("Error deleting skill");
    }
  };

  const startEditing = (skill) => {
    setEditingSkillId(skill._id);
    setEditingData({
      name: skill.name,
      category: skill.category,
      description: skill.description,
      tags: Array.isArray(skill.tags) ? skill.tags.join(", ") : "",
    });
  };

  const cancelEditing = () => {
    setEditingSkillId(null);
    setEditingData({ name: "", category: "", description: "", tags: "" });
  };

  const handleEditingChange = (e) => {
    setEditingData({ ...editingData, [e.target.name]: e.target.value });
  };

  const saveEditedSkill = async (skillId) => {
    const tagsArray = editingData.tags.split(",").map((tag) => tag.trim()).filter((tag) => tag);
    try {
      const response = await fetch(`http://localhost:5000/api/admin/skills/${skillId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editingData.name,
          category: editingData.category,
          description: editingData.description,
          tags: tagsArray,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setSkills((prev) => prev.map((s) => (s._id === data._id ? data : s)));
        setEditingSkillId(null);
        setEditingData({ name: "", category: "", description: "", tags: "" });
        alert("Skill updated successfully");
      } else {
        alert(data.message || "Error updating skill");
      }
    } catch (error) {
      console.error(error);
      alert("Error updating skill");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Skill Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleChange} required>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required />
        </div>
        <div>
          <label>Tags</label>
          <input type="text" name="tags" value={formData.tags} onChange={handleChange} />
        </div>
        <button type="submit">Add Skill</button>
        {message && <p>{message}</p>}
      </form>
      <h3>List of Skills</h3>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Category</th>
            <th>Description</th>
            <th>Tags</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((skill) => (
            <tr key={skill._id}>
              <td>
                {editingSkillId === skill._id ? (
                  <input type="text" name="name" value={editingData.name} onChange={handleEditingChange} />
                ) : (
                  skill.name
                )}
              </td>
              <td>
                {editingSkillId === skill._id ? (
                  <select name="category" value={editingData.category} onChange={handleEditingChange}>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                ) : (
                  skill.category
                )}
              </td>
              <td>
                {editingSkillId === skill._id ? (
                  <textarea name="description" value={editingData.description} onChange={handleEditingChange} />
                ) : (
                  skill.description
                )}
              </td>
              <td>
                {editingSkillId === skill._id ? (
                  <input type="text" name="tags" value={editingData.tags} onChange={handleEditingChange} />
                ) : (
                  Array.isArray(skill.tags) ? skill.tags.join(", ") : ""
                )}
              </td>
              <td>{new Date(skill.createdAt).toLocaleString()}</td>
              <td>
                {editingSkillId === skill._id ? (
                  <>
                    <button onClick={() => saveEditedSkill(skill._id)}>Save</button>
                    <button onClick={cancelEditing}>Cancel</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleDeleteSkill(skill._id)}>Delete</button>
                    <button onClick={() => startEditing(skill)}>Modify</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("statistics");
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
      return newMode;
    });
  };

  const renderSection = () => {
    switch (activeSection) {
      case "statistics":
        return (
          <div className="section-content">
            <h2>Overview Statistics</h2>
            <div className="stats-grid">
              <div className="stats-card">
                <h3>Users Overview</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={statsData.users.roles}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="role" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="var(--primary-color)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="stats-card">
                <h3>Course Categories</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={statsData.courses.categories}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="var(--accent-color)"
                      label
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="stats-card metric-group">
                <div className="metric-box">
                  <h4>Total Users</h4>
                  <p className="metric-value">{statsData.users.total}</p>
                </div>
                <div className="metric-box">
                  <h4>Total Courses</h4>
                  <p className="metric-value">{statsData.courses.total}</p>
                </div>
                <div className="metric-box">
                  <h4>Skills Available</h4>
                  <p className="metric-value">{statsData.skills.total}</p>
                </div>
              </div>
              <div className="stats-card">
                <h3>Trending Skills</h3>
                <ul className="trending-list">
                  {statsData.skills.trending.map((skill, index) => (
                    <li key={index} className="trending-item">
                      <span className="trending-rank">#{index + 1}</span>
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      case "users":
        return (
          <div className="section-content">
            <h2>Users</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {dummyUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "courses":
        return (
          <div className="section-content">
            <h2>Courses</h2>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {dummyCourses.map((course) => (
                  <tr key={course.id}>
                    <td>{course.title}</td>
                    <td>{course.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "jobs":
        return (
          <div className="section-content">
            <h2>Jobs</h2>
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th>Location</th>
                </tr>
              </thead>
              <tbody>
                {dummyJobs.map((job) => (
                  <tr key={job.id}>
                    <td>{job.title}</td>
                    <td>{job.company}</td>
                    <td>{job.location}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "groups":
        return (
          <div className="section-content">
            <h2>Groups</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Members</th>
                </tr>
              </thead>
              <tbody>
                {dummyGroups.map((group) => (
                  <tr key={group.id}>
                    <td>{group.name}</td>
                    <td>{group.members}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "events":
        return (
          <div className="section-content">
            <h2>Events</h2>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {dummyEvents.map((event) => (
                  <tr key={event.id}>
                    <td>{event.name}</td>
                    <td>{event.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "addSkill":
        return (
          <div className="section-content">
            <h2>Add New Skill</h2>
            <SkillManager />
          </div>
        );
      default:
        return <div>Select a section from the sidebar.</div>;
    }
  };

  return (
    <>
      <button className="admin-darkmode-toggle" onClick={toggleDarkMode}>
        {darkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
      </button>
      <section className="admin-dashboard">
        <aside className="dashboard-sidebar">
          <h1 className="logo">SkillMinds Admin</h1>
          <ul>
            <li className={activeSection === "statistics" ? "active" : ""} onClick={() => setActiveSection("statistics")}>📊 Statistics</li>
            <li className={activeSection === "users" ? "active" : ""} onClick={() => setActiveSection("users")}>👥 Users</li>
            <li className={activeSection === "courses" ? "active" : ""} onClick={() => setActiveSection("courses")}>📚 Courses</li>
            <li className={activeSection === "jobs" ? "active" : ""} onClick={() => setActiveSection("jobs")}>💼 Jobs</li>
            <li className={activeSection === "groups" ? "active" : ""} onClick={() => setActiveSection("groups")}>👥 Groups</li>
            <li className={activeSection === "events" ? "active" : ""} onClick={() => setActiveSection("events")}>🗓 Events</li>
            <li className={activeSection === "addSkill" ? "active" : ""} onClick={() => setActiveSection("addSkill")}>➕ Add Skill</li>
          </ul>
        </aside>
        <main className="dashboard-content">
          {renderSection()}
        </main>
      </section>
    </>
  );
};

export default AdminDashboard;
