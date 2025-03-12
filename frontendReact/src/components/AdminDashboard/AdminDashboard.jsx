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
import AddActivityBack from "../activities/AddActivityBack";

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


const Message = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
      <div className={`message ${type}`}>
        {message}
      </div>
  );
};

const UserManager = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
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
  const [message, setMessage] = useState(null);

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

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleRowClick = async (id) => {
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
        showMessage(data.message || "Error updating user skills", "error");
        return false;
      }
    } catch (err) {
      console.error(err);
      showMessage("Error updating user skills", "error");
      return false;
    }
  };

  const verifyUserSkill = async (skillId) => {
    try {
      const skillObj = userSkills.find((s) => s._id === skillId);
      const skillName = skillObj?.skillId?.name || "Skill";
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
        await fetch("http://localhost:5000/api/notifications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: selectedUser._id,
            type: "SKILL_VERIFICATION",
            message: `${skillName} is verified by the admin, check your profile`,
          }),
        });
        showMessage("✅ Skill verified");
      } else {
        const data = await response.json();
        showMessage(data.message || "Error verifying skill", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Error verifying skill", "error");
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
          showMessage("✅ User updated");
        }
        setEditingUserId(null);
      } else {
        showMessage(data.message || "Error updating user", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Error updating user", "error");
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      const skillToDelete = userSkills.find((skill) => skill._id === skillId);
      const skillName = skillToDelete?.skillId?.name || "Unknown Skill";

      const response = await fetch(`http://localhost:5000/api/users/userskills/${skillId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${selectedUser._id}`);
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setUserSkills(skillsData);

          if (skillToDelete && skillToDelete.skillType === "has") {
            await fetch("http://localhost:5000/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: selectedUser._id,
                type: "SKILL_REMOVAL",
                message: `${skillName} was deleted from your skills by admin, check your profile`,
              }),
            });
          }
        }
        showMessage("🗑 Skill deleted successfully");
      } else {
        const data = await response.json();
        showMessage(data.message || "Error deleting skill", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Error deleting skill", "error");
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
        showMessage("User deleted successfully");
      } else {
        showMessage(data.message || "Error deleting user", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Error deleting user", "error");
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
              message: "Your mentor skills have been verified by the admin, check your profile",
            }),
          });
          if (notifRes.ok) {
            showMessage("✅ User role updated to mentor and skills verified");
          } else {
            showMessage("User role updated, but failed to send notification", "warning");
          }
        }
      } else {
        showMessage(data.message || "Error updating user role", "error");
      }
    } catch (err) {
      console.error(err);
      showMessage("Error updating user role", "error");
    }
  };

  const wantsToLearnSkills = userSkills.filter((s) => s.skillType === "wantsToLearn");
  const hasSkillsList = userSkills.filter((s) => s.skillType === "has");

  return (
      <div className="user-manager">
        {message && (
            <Message
                message={message.text}
                type={message.type}
                onClose={() => setMessage(null)}
            />
        )}
        <table className="user-table">
          <thead>
          <tr>
            <th>Username</th>
            <th>Email</th>
            <th>Role (👇 Click to expand)</th>
          </tr>
          </thead>
          <tbody>
          {users.map((userItem) => (
              <React.Fragment key={userItem._id}>
                <tr onClick={() => handleRowClick(userItem._id)}>
                  <td>{userItem.username}</td>
                  <td>{userItem.email}</td>
                  <td>
                    {userItem.role}{" "}
                    {selectedUser && selectedUser._id === userItem._id ? null : "👇 Click to expand"}
                  </td>
                </tr>
                {selectedUser && selectedUser._id === userItem._id && (
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
                                          {skill.skillId ? skill.skillId.name : "Skill no longer available"}
                                          <button onClick={() => handleDeleteSkill(skill._id)}>🗑</button>
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
                                          {skill.skillId ? skill.skillId.name : "Skill no longer available"}{" "}
                                          <span className="verification-status">({skill.verificationStatus})</span>
                                          {skill.verificationStatus !== "verified" && (
                                              <button onClick={() => verifyUserSkill(skill._id)}>✅</button>
                                          )}
                                          <button onClick={() => handleDeleteSkill(skill._id)}>🗑</button>
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
                                      <h4>Certificate{selectedUser.certificateImage.length > 1 ? "s" : ""}</h4>
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
                                  <button onClick={() => startEditing(selectedUser)}>✏️</button>
                                  <button onClick={() => deleteUser(selectedUser._id)}>🗑</button>
                                  {selectedUser.role === "unverified mentor" && (
                                      <button onClick={() => approveMentor(selectedUser._id)}>✅</button>
                                  )}
                                </>
                            ) : (
                                <>
                                  <button onClick={() => saveEditedUser(selectedUser._id)}>💾</button>
                                  <button onClick={cancelEditing}>❌</button>
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
  const [message, setMessage] = useState(null);
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
        console.error("Error fetching skill categories:", err);
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
        } else {
          console.error("Error fetching skills:", response.statusText);
        }
      } catch (err) {
        console.error("Error fetching skills:", err);
      }
    }
    fetchSkills();
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

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
        showMessage("Skill added successfully!");
        setSkills((prev) => [...prev, data]);
        setFormData({
          name: "",
          category: categories.length > 0 ? categories[0] : "",
          description: "",
          tags: "",
        });
      } else {
        showMessage(data.message || "Error adding skill", "error");
      }
    } catch (error) {
      console.error("Error adding skill:", error);
      showMessage("Error adding skill", "error");
    }
  };

  const handleDeleteSkill = async (skillId) => {
    if (!window.confirm("Are you sure you want to delete this skill?")) return;
    try {
      const skillData = skills.find((skill) => skill._id === skillId);
      if (!skillData) throw new Error("Skill details not found in local state");
      const skillName = skillData.name;

      const usersWithSkillResponse = await fetch(
          `http://localhost:5000/api/users/userskills/bySkillId/${skillId}`
      );
      let usersWithSkill = [];
      if (usersWithSkillResponse.ok) {
        usersWithSkill = await usersWithSkillResponse.json();
      } else if (usersWithSkillResponse.status === 404) {
        console.log("No users found with this skill.");
      } else {
        console.warn("Error fetching users with skill:", usersWithSkillResponse.statusText);
      }

      const deleteSkillResponse = await fetch(`http://localhost:5000/api/admin/skills/${skillId}`, {
        method: "DELETE",
      });
      if (!deleteSkillResponse.ok) {
        const deleteData = await deleteSkillResponse.json();
        throw new Error(deleteData.message || "Error deleting skill");
      }

      const deleteUserSkillsResponse = await fetch(
          `http://localhost:5000/api/users/userskills/removeBySkillId/${skillId}`,
          { method: "DELETE" }
      );
      if (!deleteUserSkillsResponse.ok) {
        console.warn("Error deleting UserSkill references:", deleteUserSkillsResponse.statusText);
      }

      setSkills((prev) => prev.filter((skill) => skill._id !== skillId));

      const usersWithHasSkill = usersWithSkill.filter((userSkill) => userSkill.skillType === "has");
      if (usersWithHasSkill.length > 0) {
        const notificationPromises = usersWithHasSkill.map((userSkill) =>
            fetch("http://localhost:5000/api/notifications", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: userSkill.userId,
                type: "SKILL_REMOVAL",
                message: `${skillName} is no longer available, check your profile`,
              }),
            })
        );
        await Promise.all(notificationPromises);
      }
      showMessage("🗑 Skill deleted successfully");
    } catch (error) {
      console.error("Error deleting skill:", error);
      showMessage("Error deleting skill: " + error.message, "error");
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
        showMessage("💾 Skill updated successfully");
      } else {
        showMessage(data.message || "Error updating skill", "error");
      }
    } catch (error) {
      console.error("Error updating skill:", error);
      showMessage("Error updating skill", "error");
    }
  };

  return (
      <div className="skill-manager">
        {message && (
            <Message
                message={message.text}
                type={message.type}
                onClose={() => setMessage(null)}
            />
        )}
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
          <button type="submit">➕ Add Skill</button>
        </form>
        <h3>Skill List</h3>
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
                        <button onClick={() => saveEditedSkill(skill._id)}>💾</button>
                        <button onClick={cancelEditing}>❌</button>
                      </>
                  ) : (
                      <>
                        <button onClick={() => startEditing(skill)}>✏️</button>
                        <button onClick={() => handleDeleteSkill(skill._id)}>🗑</button>
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


const ActivityManager = ({ activities, setActivities }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editingData, setEditingData] = useState({
    title: '',
    description: '',
    category: 'Workshop',
    date: new Date().toISOString().split('T')[0],
    location: '',
    isPaid: false,
    amount: 0,
    link: '',
    eventImage: null,
  });

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/events', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch activities');
        }

        const data = await response.json();
        setActivities(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load activities');
        setLoading(false);
      }
    };

    fetchActivities();
  }, [setActivities]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) return;
    try {
      const response = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setActivities((prev) => prev.filter((activity) => activity._id !== id));
        setError({ text: '🗑 Activity deleted successfully', type: 'success' });
      } else {
        throw new Error('Failed to delete activity');
      }
    } catch (err) {
      console.error('Error deleting activity:', err);
      setError({ text: 'Error deleting activity', type: 'error' });
    }
  };

  const startEditing = (activity) => {
    setEditingActivityId(activity._id);
    setEditingData({
      title: activity.title,
      description: activity.description,
      category: activity.category,
      date: new Date(activity.date).toISOString().split('T')[0],
      location: activity.location,
      isPaid: activity.isPaid,
      amount: activity.amount || 0,
      link: activity.link || '',
      eventImage: null,
    });
  };

  const cancelEditing = () => {
    setEditingActivityId(null);
    setEditingData({
      title: '',
      description: '',
      category: 'Workshop',
      date: new Date().toISOString().split('T')[0],
      location: '',
      isPaid: false,
      amount: 0,
      link: '',
      eventImage: null,
    });
  };

  const handleEditingChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setEditingData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
      ...(name === 'isPaid' && !checked && { amount: 0 }), // Reset amount if isPaid is unchecked
    }));
  };

  const saveEditedActivity = async (activityId) => {
    try {
      const formData = new FormData();
      Object.keys(editingData).forEach((key) => {
        if (key === 'eventImage' && editingData[key]) {
          formData.append('image', editingData[key]);
        } else if (key !== 'eventImage') {
          formData.append(key, editingData[key]);
        }
      });

      const url = activityId === 'new'
        ? 'http://localhost:5000/api/events' // POST for new activity
        : `http://localhost:5000/api/events/${activityId}`; // PUT for update

      const method = activityId === 'new' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setActivities((prev) => {
          if (activityId === 'new') {
            return [data, ...prev]; // Add new activity to the list
          } else {
            return prev.map((a) => (a._id === data._id ? data : a)); // Update existing activity
          }
        });
        setEditingActivityId(null);
        setError({ text: activityId === 'new' ? '➕ Activity created successfully' : '💾 Activity updated successfully', type: 'success' });
      } else {
        throw new Error(data.message || 'Error saving activity');
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      setError({ text: 'Error saving activity', type: 'error' });
    }
  };

  return (
    <div className="skill-manager">
      {error && (
        <div className={`message ${error.type}`}>
          {error.text}
          <button onClick={() => setError('')}>×</button>
        </div>
      )}
      <h3>Activities List</h3>
      {loading ? (
        <div className="loading">⏳ Loading activities...</div>
      ) : (
        <table className="skill-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Date</th>
              <th>Location</th>
              <th>Type</th>
              <th>Created By</th>
              <th>Participants</th> {/* New column for participants */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((activity) => (
              <tr key={activity._id}>
                <td>
                  {editingActivityId === activity._id ? (
                    <input
                      type="text"
                      name="title"
                      value={editingData.title}
                      onChange={handleEditingChange}
                    />
                  ) : (
                    activity.title
                  )}
                </td>
                <td>
                  {editingActivityId === activity._id ? (
                    <select
                      name="category"
                      value={editingData.category}
                      onChange={handleEditingChange}
                    >
                      {['Workshop', 'Webinar', 'Meetup', 'Training'].map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : (
                    activity.category
                  )}
                </td>
                <td>
                  {editingActivityId === activity._id ? (
                    <input
                      type="date"
                      name="date"
                      value={editingData.date}
                      onChange={handleEditingChange}
                    />
                  ) : (
                    new Date(activity.date).toLocaleDateString()
                  )}
                </td>
                <td>
                  {editingActivityId === activity._id ? (
                    <input
                      type="text"
                      name="location"
                      value={editingData.location}
                      onChange={handleEditingChange}
                    />
                  ) : (
                    activity.location || 'Virtual'
                  )}
                </td>
                <td>
                  {editingActivityId === activity._id ? (
                    <>
                      <label>
                        <input
                          type="checkbox"
                          name="isPaid"
                          checked={editingData.isPaid}
                          onChange={handleEditingChange}
                        />
                        Paid
                      </label>
                      {editingData.isPaid && (
                        <input
                          type="number"
                          name="amount"
                          value={editingData.amount}
                          onChange={handleEditingChange}
                          min="0"
                          step="0.01"
                        />
                      )}
                    </>
                  ) : (
                    activity.isPaid ? `💰 $${activity.amount}` : 'Free'
                  )}
                </td>
                <td>
                  {activity.createdBy?.username || 'Unknown'}
                </td>
                <td>
                  {/* Display participants */}
                  {activity.participants?.length > 0 ? (
                    <ul className="participants-list">
                      {activity.participants.map((participant, index) => (
                        <li key={index}>{participant.username || 'Anonymous'}</li>
                      ))}
                    </ul>
                  ) : (
                    'No participants'
                  )}
                </td>
                <td>
                  {editingActivityId === activity._id ? (
                    <>
                      <button onClick={() => saveEditedActivity(activity._id)}>
                        💾
                      </button>
                      <button onClick={cancelEditing}>❌</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => startEditing(activity)}>✏️</button>
                      <button onClick={() => handleDelete(activity._id)}>🗑</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("statistics");
  const [darkMode, setDarkMode] = useState(false);
  const [activities, setActivities] = useState([]);
  useEffect(() => {
    console.log('Activities updated:', activities);
  }, [activities]);
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
  const handleAddActivity = (newActivity) => {
    setActivities((prevActivities) => [newActivity, ...prevActivities]);
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
              <h2>Add New Activity </h2>
              <AddActivityBack onAddActivity={handleAddActivity} />
              <ActivityManager activities={activities} setActivities={setActivities} />
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
              🗓 Activities
            </li>
                <li
                    className={activeSection === "addSkill" ? "active" : ""}
                    onClick={() => setActiveSection("addSkill")}
                >
                  ➕ Skills
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