import React, { useState, useEffect } from "react";
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
import Header from "../common/header/Header";
import Footer from "../common/footer/Footer";
import "./AdminDashboard.css";

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

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); // holds the expanded user details
  const [userSkills, setUserSkills] = useState([]);
  const [editingUserId, setEditingUserId] = useState(null);
  const [editingData, setEditingData] = useState({
    username: "",
    email: "",
    role: "",
    phoneNumber: "",
    bio: "",
    location: "",
  });
  const [availableSkills, setAvailableSkills] = useState([]);
  const [assignedSkillIds, setAssignedSkillIds] = useState([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const response = await fetch("http://localhost:5000/api/users/all");
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUsers();
  }, []);

  const handleRowClick = async (id) => {
    // If the same user is clicked again, collapse details.
    if (selectedUser && selectedUser._id === id) {
      setSelectedUser(null);
      setUserSkills([]);
      setEditingUserId(null);
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/users/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(data);
        setEditingUserId(null);
        const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${id}`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setUserSkills(skillsData);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startEditing = async (user) => {
    setEditingUserId(user._id);
    setEditingData({
      username: user.username,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || "",
      bio: user.bio || "",
      location: user.location || "",
    });
    try {
      const response = await fetch("http://localhost:5000/api/admin/skills");
      if (response.ok) {
        const skillsData = await response.json();
        setAvailableSkills(skillsData);
      }
    } catch (error) {
      console.error(error);
    }
    const currentSkillIds = userSkills.map((item) => item.skillId?._id);
    setAssignedSkillIds(currentSkillIds);
  };

  const cancelEditing = () => {
    setEditingUserId(null);
  };

  const handleEditingChange = (e) => {
    setEditingData({ ...editingData, [e.target.name]: e.target.value });
  };

  const handleSkillChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        selected.push(options[i].value);
      }
    }
    setAssignedSkillIds(selected);
  };

  const updateUserSkills = async (userId, skillsPayload) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/userskills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, skills: skillsPayload }),
      });
      if (response.ok) {
        return true;
      } else {
        const data = await response.json();
        alert(data.message || "Error updating user skills");
        return false;
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user skills");
      return false;
    }
  };

  const saveEditedUser = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingData),
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(users.map((u) => (u._id === data._id ? data : u)));
        setSelectedUser(data);

        const combinedPayload = [
          ...userSkills
            .filter((skill) => skill.skillType === "has")
            .map((skill) => ({
              skillId: skill.skillId?._id,
              skillType: "has",
              verificationStatus: "unverified",
            })),
          ...userSkills
            .filter((skill) => skill.skillType === "wantsToLearn")
            .map((skill) => ({
              skillId: skill.skillId?._id,
              skillType: "wantsToLearn",
              verificationStatus: skill.verificationStatus || "pending",
            })),
        ];
        const skillsUpdated = await updateUserSkills(userId, combinedPayload);
        if (skillsUpdated) {
          const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${userId}`);
          if (skillsResponse.ok) {
            const skillsData = await skillsResponse.json();
            setUserSkills(skillsData);
          }
          alert("User updated successfully");
        }
        setEditingUserId(null);
      } else {
        alert(data.message || "Error updating user");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user");
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/users/userskills/${skillId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${selectedUser._id}`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setUserSkills(skillsData);
        }
        alert("Skill deleted successfully");
      } else {
        const data = await response.json();
        alert(data.message || "Error deleting skill");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting skill");
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(users.filter((u) => u._id !== userId));
        setSelectedUser(null);
        alert("User deleted successfully");
      } else {
        alert(data.message || "Error deleting user");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting user");
    }
  };

  const verifyUserSkill = async (skillId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/userskills/${skillId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verificationStatus: "verified" }),
      });
      if (response.ok) {
        const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${selectedUser._id}`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setUserSkills(skillsData);
        }
        alert("Skill verified successfully");
      } else {
        const data = await response.json();
        alert(data.message || "Error verifying skill");
      }
    } catch (err) {
      console.error(err);
      alert("Error verifying skill");
    }
  };

  const approveMentor = async (userId) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "mentor" }),
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(users.map((u) => (u._id === data._id ? data : u)));
        setSelectedUser(data);

        const combinedPayload = userSkills.map((skill) => ({
          skillId: skill.skillId?._id,
          skillType: skill.skillType,
          verificationStatus: skill.skillType === "has" ? "verified" : (skill.verificationStatus || "pending"),
        }));

        const skillsUpdated = await updateUserSkills(userId, combinedPayload);
        if (skillsUpdated) {
          const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${userId}`);
          if (skillsResponse.ok) {
            const skillsData = await skillsResponse.json();
            setUserSkills(skillsData);
          }
          const notifRes = await fetch("http://localhost:5000/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: data._id,
              type: "SKILL_VERIFICATION",
              message: "Your mentor skills have been verified by the admin.",
            }),
          });
          if (notifRes.ok) {
            alert("User role updated to mentor and skills verified.");
          } else {
            alert("User role updated to mentor, but failed to send notification.");
          }
        }
      } else {
        alert(data.message || "Error updating user role");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating user role");
    }
  };

  const wantsToLearnSkills = userSkills.filter((s) => s.skillType === "wantsToLearn");
  const hasSkillsList = userSkills.filter((s) => s.skillType === "has");

  return (
    <div className="user-manager">
      <table className="user-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <React.Fragment key={user._id}>
              <tr onClick={() => handleRowClick(user._id)}>
                <td>{user.username}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
              {selectedUser && selectedUser._id === user._id && (
                <tr className="expanded">
                  <td colSpan="3">
                    <div className="expanded-user-details">
                      <div className="user-details-body">
                        <div className="user-details-row">
                          <span className="label">Username:</span>
                          {editingUserId === selectedUser._id ? (
                            <input
                              type="text"
                              name="username"
                              value={editingData.username}
                              onChange={handleEditingChange}
                            />
                          ) : (
                            <span className="value">{selectedUser.username}</span>
                          )}
                        </div>
                        <div className="user-details-row">
                          <span className="label">Email:</span>
                          {editingUserId === selectedUser._id ? (
                            <input
                              type="text"
                              name="email"
                              value={editingData.email}
                              onChange={handleEditingChange}
                            />
                          ) : (
                            <span className="value">{selectedUser.email}</span>
                          )}
                        </div>
                        <div className="user-details-row">
                          <span className="label">Role:</span>
                          {editingUserId === selectedUser._id ? (
                            <select name="role" value={editingData.role} onChange={handleEditingChange}>
                              <option value="learner">Learner</option>
                              <option value="unverified mentor">Unverified Mentor</option>
                              <option value="mentor">Mentor</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className="value">{selectedUser.role}</span>
                          )}
                        </div>
                        <div className="user-details-row">
                          <span className="label">Phone:</span>
                          {editingUserId === selectedUser._id ? (
                            <input
                              type="text"
                              name="phoneNumber"
                              value={editingData.phoneNumber}
                              onChange={handleEditingChange}
                            />
                          ) : (
                            <span className="value">{selectedUser.phoneNumber || "N/A"}</span>
                          )}
                        </div>
                        <div className="user-details-row">
                          <span className="label">Bio:</span>
                          {editingUserId === selectedUser._id ? (
                            <textarea
                              name="bio"
                              value={editingData.bio}
                              onChange={handleEditingChange}
                            />
                          ) : (
                            <span className="value">{selectedUser.bio || "N/A"}</span>
                          )}
                        </div>
                        <div className="user-details-row">
                          <span className="label">Location:</span>
                          {editingUserId === selectedUser._id ? (
                            <input
                              type="text"
                              name="location"
                              value={editingData.location}
                              onChange={handleEditingChange}
                            />
                          ) : (
                            <span className="value">{selectedUser.location || "N/A"}</span>
                          )}
                        </div>
                        <div className="user-details-row">
                          <span className="label">Wants to Learn:</span>
                          <ul className="user-skills-list">
                            {wantsToLearnSkills.length > 0 ? (
                              wantsToLearnSkills.map((skill) => (
                                <li key={skill._id} className="skill-item">
                                  {skill.skillId ? skill.skillId.name : "Skill Deleted"}
                                  <button onClick={() => handleDeleteSkill(skill._id)}>Delete</button>
                                </li>
                              ))
                            ) : (
                              <span className="value">No skills added</span>
                            )}
                          </ul>
                        </div>
                        <div className="user-details-row">
                          <span className="label">Has:</span>
                          <ul className="user-skills-list">
                            {hasSkillsList.length > 0 ? (
                              hasSkillsList.map((skill) => (
                                <li key={skill._id} className="skill-item">
                                  {skill.skillId ? skill.skillId.name : "Skill Deleted"}{" "}
                                  <span className="verification-status">({skill.verificationStatus})</span>
                                  <button onClick={() => verifyUserSkill(skill._id)}>Verify</button>
                                  <button onClick={() => handleDeleteSkill(skill._id)}>Delete</button>
                                </li>
                              ))
                            ) : (
                              <span className="value">No skills added</span>
                            )}
                          </ul>
                        </div>
                        {selectedUser.profileImage && (
                          <div className="user-image-container">
                            <img
                              src={`http://localhost:5000/api/files/${selectedUser.profileImage.fileId}?t=${Date.now()}`}
                              alt={selectedUser.profileImage.filename}
                            />
                          </div>
                        )}
                        {selectedUser.certificateImage &&
                          Array.isArray(selectedUser.certificateImage) &&
                          selectedUser.certificateImage.length > 0 && (
                            <div className="user-certificate-container">
                              <h4>
                                Certificate{selectedUser.certificateImage.length > 1 ? "s" : ""}
                              </h4>
                              {selectedUser.certificateImage.map((cert, index) => (
                                <img
                                  key={index}
                                  src={`http://localhost:5000/api/files/${cert.fileId}?t=${Date.now()}`}
                                  alt={cert.filename}
                                />
                              ))}
                            </div>
                        )}
                      </div>
                      <div className="user-actions">
                        {editingUserId !== selectedUser._id ? (
                          <>
                            <button onClick={() => startEditing(selectedUser)}>Modify</button>
                            <button onClick={() => deleteUser(selectedUser._id)}>Delete</button>
                            {selectedUser.role === "unverified mentor" && (
                              <button onClick={() => approveMentor(selectedUser._id)}>Approve Mentor</button>
                            )}
                          </>
                        ) : (
                          <>
                            <button onClick={() => saveEditedUser(selectedUser._id)}>Save</button>
                            <button onClick={cancelEditing}>Cancel</button>
                          </>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
      <div className="user-manager"></div>
    </div>
  );
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
    <div className="skill-manager">
      <form onSubmit={handleSubmit} className="skill-form">
        <div>
          <label>Skill Name</label>
          <input type="text" name="name" value={formData.name} onChange={handleChange} required />
        </div>
        <div>
          <label>Category</label>
          <select name="category" value={formData.category} onChange={handleChange} required>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
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
        {message && <p className="form-message">{message}</p>}
      </form>
      <h3>List of Skills</h3>
      <table className="skill-table">
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
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
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
                    <button onClick={() => startEditing(skill)}>Modify</button>
                    <button onClick={() => handleDeleteSkill(skill._id)}>Delete</button>
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

  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode === "true") {
      setDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
      localStorage.setItem("darkMode", newMode);
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
            <UserManager />
          </div>
        );
      case "courses":
        return (
          <div className="section-content">
            <h2>Courses</h2>
            <table className="data-table">
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
            <table className="data-table">
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
            <table className="data-table">
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
            <table className="data-table">
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
      <Header />
      <div className="admin-dashboard-container">
        <section className="admin-dashboard">
          <aside className="dashboard-sidebar">
            <h1 className="logo">SkillMinds Admin</h1>
            <ul>
              <li
                className={activeSection === "statistics" ? "active" : ""}
                onClick={() => setActiveSection("statistics")}
              >
                📊 Statistics
              </li>
              <li
                className={activeSection === "users" ? "active" : ""}
                onClick={() => setActiveSection("users")}
              >
                👥 Users
              </li>
              <li
                className={activeSection === "courses" ? "active" : ""}
                onClick={() => setActiveSection("courses")}
              >
                📚 Courses
              </li>
              <li
                className={activeSection === "jobs" ? "active" : ""}
                onClick={() => setActiveSection("jobs")}
              >
                💼 Jobs
              </li>
              <li
                className={activeSection === "groups" ? "active" : ""}
                onClick={() => setActiveSection("groups")}
              >
                👥 Groups
              </li>
              <li
                className={activeSection === "events" ? "active" : ""}
                onClick={() => setActiveSection("events")}
              >
                🗓 Events
              </li>
              <li
                className={activeSection === "addSkill" ? "active" : ""}
                onClick={() => setActiveSection("addSkill")}
              >
                ➕ Add Skill
              </li>
            </ul>
          </aside>
          <main className="dashboard-content">{renderSection()}</main>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default AdminDashboard;
