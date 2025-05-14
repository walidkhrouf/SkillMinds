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
  LineChart,
  Line,
  Cell
} from "recharts";
import Header from "../common/header/Header";
import Footer from "../common/footer/Footer";
import AddActivityBack from "../activities/AddActivityBack";
import axios from 'axios';

import "./AdminDashboard.css";

const Statistics = ({ statsData, tutorialStats, loading, error }) => {
  const renderStatCard = (title, value, icon) => (
      <div className="stat-card">
        <span className="stat-icon">{icon}</span>
        <h4>{title}</h4>
        <p>{value !== null && value !== undefined ? value : "N/A"}</p>
      </div>
  );

  if (loading) {
    return <div className="loading">⏳ Loading statistics...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
      <div className="statistics">
        <h3>Platform Statistics</h3>
        <div className="stat-grid">
          {renderStatCard("Total Users", statsData?.users?.total, "👥")}
          {renderStatCard("Total Skills", statsData?.skills?.total, "📚")}
          {renderStatCard("Total Tutorials", tutorialStats?.totalTutorials, "📝")}
          {renderStatCard(
              "Avg Likes/Tutorial",
              tutorialStats?.engagementMetrics.find((m) => m.name === "Likes")?.value,
              "👍"
          )}
          {renderStatCard(
              "Avg Comments/Tutorial",
              tutorialStats?.engagementMetrics.find((m) => m.name === "Comments")?.value,
              "💬"
          )}
        </div>
      </div>
  );
};

// Dummy data for sections that aren't yet integrated with the backend
const dummyCourses = [
  { id: 1, title: "React Basics", description: "Learn the fundamentals of React." },
  { id: 2, title: "Advanced Node.js", description: "Deep dive into Node.js." },
];

const dummyJobs = [
  { id: 1, title: "Frontend Developer", company: "Tech Corp", location: "Remote" },
  { id: 2, title: "Backend Developer", company: "Dev Solutions", location: "Onsite" },
];

// Default stats data in case API calls fail
const defaultStatsData = {
  users: {
    total: 0,
    roles: [],
  },
  courses: {
    total: 0,
    categories: [
      { name: "Technical", value: 0 },
      { name: "Business", value: 0 },
      { name: "Design", value: 0 },
      { name: "Other", value: 0 },
    ],
  },
  skills: {
    total: 0,
    trending: [],
  },
  groups: {
    totalGroups: 0,
    totalPosts: 0,
    totalComments: 0,
    totalLikes: 0,
    totalDislikes: 0,
    groupActivityOverTime: [],
    mostActiveGroups: [],
    privacyDistribution: [],
    avgEngagementPerPost: 0,
    topGroupsByMembers: [],
  },
  activities: {
    total: 0,
    categories: [],
    trending: [],
  },
  tutorials: { totalTutorials: 0, engagementMetrics: [] }

};

// Message Component for displaying success/error messages
const Message = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
      <div className={`message ${type}`} role="alert" aria-live="assertive">
        {message}
        <button onClick={onClose}>×</button>
      </div>
  );
};

// UserManager Component
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
  const [loading, setLoading] = useState(true);
 
  const fetchJobDetails = (jobId) => {
    const url = currentUser.role === 'admin' 
      ? `http://localhost:5000/api/recruitment/job-offers/${jobId}/applications` 
      : `http://localhost:5000/api/recruitment/job-offers/${jobId}`;
  
    axios.get(url, {
      params: { userId: currentUser._id, role: currentUser.role }
    })
      .then(res => {
        if (currentUser.role === 'admin') {
          console.log('Admin applications response:', res.data);
          setApplications(res.data.applications || []);
        } else {
          console.log('User job details response:', res.data);
          setSelectedJob(res.data.jobOffer);
          if (res.data.applications) setApplications(res.data.applications);
        }
      })
      .catch(err => console.error('Error fetching job details:', err));
  };

useEffect(() => {
  async function fetchSkills() {
    try {
      const response = await fetch("http://localhost:5000/api/admin/skills");
      if (response.ok) {
        const data = await response.json();
        const map = {};
        // Créer un objet skillsMap où chaque skill ID est une clé et son nom est la valeur
        data.forEach(skill => {
          map[skill._id] = skill.name;
        });
        setSkillsMap(map); // Met à jour l'état skillsMap
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des compétences", err);
    }
  }

  fetchSkills(); // Appel de la fonction fetchSkills lors du montage du composant
}, []);


  

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          showMessage("Please log in to continue", "error");
          return;
        }
        const response = await fetch("http://localhost:5000/api/users/all", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        } else {
          showMessage("Failed to fetch users", "error");
        }
      } catch (err) {
        console.error(err);
        showMessage("Error fetching users", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    const interval = setInterval(fetchUsers, 30000); // Reduced polling frequency to 30 seconds
    return () => clearInterval(interval);
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
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
      const token = localStorage.getItem("jwtToken");
      const response = await fetch("http://localhost:5000/api/admin/skills", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const skillsData = await response.json();
        setAvailableSkills(skillsData);
      } else {
        showMessage("Failed to fetch skills", "error");
      }
    } catch (error) {
      console.error(error);
      showMessage("Error fetching skills", "error");
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
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/users/userskills`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("jwtToken");
      const skillObj = userSkills.find((s) => s._id === skillId);
      const skillName = skillObj?.skillId?.name || "Skill";
      const response = await fetch(`http://localhost:5000/api/users/userskills/${skillId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ verificationStatus: "verified" }),
      });
      if (response.ok) {
        const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setUserSkills(skillsData);
        }
        await fetch("http://localhost:5000/api/notifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
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
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
          const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
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
      const token = localStorage.getItem("jwtToken");
      const skillToDelete = userSkills.find((skill) => skill._id === skillId);
      const skillName = skillToDelete?.skillId?.name || "Unknown Skill";

 const response = await fetch(`http://localhost:5000/api/users/userskills/${skillId}`, {
   method: "DELETE",
   headers: { Authorization: `Bearer ${token}` },
 });
      if (response.ok) {
        const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (skillsResponse.ok) {
          const skillsData = await skillsResponse.json();
          setUserSkills(skillsData);

          if (skillToDelete && skillToDelete.skillType === "has") {
            await fetch("http://localhost:5000/api/notifications", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
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
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
          const skillsResponse = await fetch(`http://localhost:5000/api/users/userskills?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (skillsResponse.ok) {
            const skillsData = await skillsResponse.json();
            setUserSkills(skillsData);
          }
          const notifRes = await fetch("http://localhost:5000/api/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
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
        {loading ? (
            <div className="loading">⏳ Loading users...</div>
        ) : (
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
                                  <ul className="user-skills-list wants-to-learn">
                                    {wantsToLearnSkills.length > 0 ? (
                                        wantsToLearnSkills.map((skill) => (
                                            <li key={skill._id} className="skill-item">
                                    <span className="skill-name">
                                      {skill.skillId ? skill.skillId.name : "Skill no longer available"}
                                    </span>
                                              <button className="delete-btn" onClick={() => handleDeleteSkill(skill._id)}>🗑</button>
                                            </li>
                                        ))
                                    ) : (
                                        <span className="value">No skills added</span>
                                    )}
                                  </ul>
                                </div>
                                <div className="user-details-row">
                                  <span className="label">Has:</span>
                                  <ul className="user-skills-list has-skills">
                                    {hasSkillsList.length > 0 ? (
                                        hasSkillsList.map((skill, index) => (
                                            <li key={skill._id} className="skill-item">
                                              <div className="skill-card">
                                                <div className="skill-header">
                                        <span className="skill-name">
                                          {skill.skillId ? skill.skillId.name : "Skill no longer available"}
                                        </span>
                                                  <span className="verification-status">
                                          ({skill.verificationStatus})
                                        </span>
                                                </div>
                                                {selectedUser.certificateImage && selectedUser.certificateImage[index] && (
                                                    <div className="skill-certificate">
                                                      <img
                                                          src={`http://localhost:5000/api/files/${selectedUser.certificateImage[index].fileId}?t=${Date.now()}`}
                                                          alt={selectedUser.certificateImage[index].filename}
                                                      />
                                                      <p>Certificate: {selectedUser.certificateImage[index].filename}</p>
                                                    </div>
                                                )}
                                                <div className="skill-actions">
                                                  {skill.verificationStatus !== "verified" && (
                                                      <button className="verify-btn" onClick={() => verifyUserSkill(skill._id)}>✅ Verify</button>
                                                  )}
                                                  <button className="delete-btn" onClick={() => handleDeleteSkill(skill._id)}>🗑 Delete</button>
                                                </div>
                                              </div>
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
                              </div>
                              <div className="user-actions">
                                {editingUserId !== selectedUser._id ? (
                                    <>
                                      <button onClick={() => startEditing(selectedUser)}>✏️ Edit</button>
                                      <button onClick={() => deleteUser(selectedUser._id)}>🗑 Delete</button>
                                      {selectedUser.role === "unverified mentor" && (
                                          <button onClick={() => approveMentor(selectedUser._id)}>✅ Approve Mentor</button>
                                      )}
                                    </>
                                ) : (
                                    <>
                                      <button onClick={() => saveEditedUser(selectedUser._id)}>💾 Save</button>
                                      <button onClick={cancelEditing}>❌ Cancel</button>
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
        )}
      </div>
  );
};

// SkillManager Component
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoriesAndSkills = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        const [categoriesResponse, skillsResponse] = await Promise.all([
          fetch("http://localhost:5000/api/admin/skillCategories", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/admin/skills", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (categoriesResponse.ok) {
          const data = await categoriesResponse.json();
          setCategories(data);
          if (data.length > 0 && !formData.category) {
            setFormData((prev) => ({ ...prev, category: data[0] }));
          }
        } else {
          showMessage("Failed to fetch skill categories", "error");
        }
        if (skillsResponse.ok) {
          const data = await skillsResponse.json();
          setSkills(data);
        } else {
          showMessage("Failed to fetch skills", "error");
        }
      } catch (err) {
        console.error("Error fetching skill data:", err);
        showMessage("Error fetching skills or categories", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchCategoriesAndSkills();
    const interval = setInterval(fetchCategoriesAndSkills, 30000); // Reduced polling frequency
    return () => clearInterval(interval);
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
    if (!name.trim()) {
      showMessage("Skill name is required", "error");
      return;
    }
    const tagsArray = tags.split(",").map((tag) => tag.trim()).filter((tag) => tag);
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch("http://localhost:5000/api/admin/skills", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
      const token = localStorage.getItem("jwtToken");
      const skillData = skills.find((skill) => skill._id === skillId);
      if (!skillData) throw new Error("Skill details not found in local state");
      const skillName = skillData.name;

      const usersWithSkillResponse = await fetch(
          `http://localhost:5000/api/users/userskills/bySkillId/${skillId}`,
          { headers: { Authorization: `Bearer ${token}` } }
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
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!deleteSkillResponse.ok) {
        const deleteData = await deleteSkillResponse.json();
        throw new Error(deleteData.message || "Error deleting skill");
      }

      const deleteUserSkillsResponse = await fetch(
          `http://localhost:5000/api/users/userskills/removeBySkillId/${skillId}`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
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
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
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
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/admin/skills/${skillId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
        {loading ? (
            <div className="loading">⏳ Loading skills...</div>
        ) : (
            <>
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
            </>
        )}
      </div>
  );
};

// GroupManager Component (from Code 1)
const GroupManager = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingData, setEditingData] = useState({ name: "" });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await fetch("http://localhost:5000/api/admin/groups", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setGroups(data);
        } else {
          showMessage("Error fetching groups", "error");
        }
      } catch (err) {
        console.error("Error fetching groups:", err);
        showMessage("Error fetching groups", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
    const interval = setInterval(fetchGroups, 30000); // Reduced polling frequency
    return () => clearInterval(interval);
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleGroupClick = (groupId) => {
    if (selectedGroup && selectedGroup._id === groupId) {
      setSelectedGroup(null);
      setSelectedPost(null);
      setEditingGroupId(null);
      return;
    }
    const group = groups.find((g) => g._id === groupId);
    setSelectedGroup(group);
    setSelectedPost(null);
    setEditingGroupId(null);
  };

  const handlePostClick = (postId) => {
    if (selectedPost && selectedPost._id === postId) {
      setSelectedPost(null);
      return;
    }
    const post = selectedGroup.posts.find((p) => p._id === postId);
    if (!post) {
      showMessage("Post not found", "error");
      return;
    }
    setSelectedPost(post);
  };

  const startEditing = (group) => {
    setEditingGroupId(group._id);
    setEditingData({ name: group.name });
  };

  const cancelEditing = () => {
    setEditingGroupId(null);
    setEditingData({ name: "" });
  };

  const handleEditingChange = (e) => {
    setEditingData({ ...editingData, [e.target.name]: e.target.value });
  };

  const saveEditedGroup = async (groupId) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/admin/groups/${groupId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editingData.name }),
      });
      const data = await response.json();
      if (response.ok) {
        setGroups(groups.map((g) => (g._id === groupId ? { ...g, name: data.group.name } : g)));
        setSelectedGroup({ ...selectedGroup, name: data.group.name });
        setEditingGroupId(null);
        showMessage("✅ Group name updated successfully");
      } else {
        showMessage(data.message || "Error updating group", "error");
      }
    } catch (err) {
      console.error("Error updating group:", err);
      showMessage("Error updating group", "error");
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm("Are you sure you want to delete this group?")) return;
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/admin/groups/${groupId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setGroups(groups.filter((g) => g._id !== groupId));
        setSelectedGroup(null);
        showMessage("🗑 Group deleted successfully");
      } else {
        const data = await response.json();
        showMessage(data.message || "Error deleting group", "error");
      }
    } catch (err) {
      console.error("Error deleting group:", err);
      showMessage("Error deleting group", "error");
    }
  };

  const deleteGroupPost = async (groupId, postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/admin/groups/${groupId}/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setGroups(groups.map((g) =>
            g._id === groupId
                ? { ...g, posts: g.posts.filter((p) => p._id !== postId), postCount: g.postCount - 1 }
                : g
        ));
        setSelectedGroup({
          ...selectedGroup,
          posts: selectedGroup.posts.filter((p) => p._id !== postId),
          postCount: selectedGroup.postCount - 1
        });
        setSelectedPost(null);
        showMessage("🗑 Post deleted successfully");
      } else {
        const data = await response.json();
        showMessage(data.message || "Error deleting post", "error");
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      showMessage("Error deleting post", "error");
    }
  };

  return (
      <div className="group-manager">
        {message && (
            <Message
                message={message.text}
                type={message.type}
                onClose={() => setMessage(null)}
            />
        )}
        {loading ? (
            <div className="loading">⏳ Loading groups...</div>
        ) : (
            <table className="data-table">
              <thead>
              <tr>
                <th>Name</th>
                <th>Members</th>
                <th>Posts</th>
                <th>Reports</th>
                <th>Created By</th>
                <th>Privacy</th>
              </tr>
              </thead>
              <tbody>
              {groups.map((group) => (
                  <React.Fragment key={group._id}>
                    <tr onClick={() => handleGroupClick(group._id)} className="group-row">
                      <td>{group.name}</td>
                      <td>{group.memberCount || 0}</td>
                      <td>{group.postCount || 0}</td>
                      <td>{group.reports?.length || 0}</td>
                      <td>{group.createdBy?.username || "Unknown"}</td>
                      <td>{group.privacy}</td>
                    </tr>
                    {selectedGroup && selectedGroup._id === group._id && (
                        <tr className="expanded">
                          <td colSpan="6">
                            <div className="expanded-group-details">
                              <div className="group-details-body">
                                <div className="group-details-row">
                                  <span className="label">Group Name:</span>
                                  {editingGroupId === group._id ? (
                                      <input
                                          type="text"
                                          name="name"
                                          value={editingData.name}
                                          onChange={handleEditingChange}
                                      />
                                  ) : (
                                      <span className="value">{group.name}</span>
                                  )}
                                </div>
                                <div className="group-details-row">
                                  <span className="label">Description:</span>
                                  <span className="value">{group.description || "N/A"}</span>
                                </div>
                                <div className="group-details-row">
                                  <span className="label">Privacy:</span>
                                  <span className="value">{group.privacy}</span>
                                </div>
                                <div className="group-details-row">
                                  <span className="label">Created At:</span>
                                  <span className="value">{new Date(group.createdAt).toLocaleString()}</span>
                                </div>
                                <div className="group-details-row">
                                  <span className="label">Members ({group.memberCount || 0}):</span>
                                  <div className="members-list">
                                    {group.members && group.members.length > 0 ? (
                                        group.members.map((member) => (
                                            <span key={member.id} className="member-item">
                                    {member.username || "Unknown"}
                                  </span>
                                        ))
                                    ) : (
                                        <span className="value">No members</span>
                                    )}
                                  </div>
                                </div>
                                <div className="group-details-row">
                                  <span className="label">Posts ({group.postCount || 0}):</span>
                                  <div className="posts-container">
                                    {group.posts && group.posts.length > 0 ? (
                                        group.posts.map((post) => (
                                            <React.Fragment key={post._id}>
                                              <div
                                                  className="post-item"
                                                  onClick={() => handlePostClick(post._id)}
                                              >
                                                <span className="post-title">{post.title}</span>
                                                <span className="post-meta">
                                        {post.likesCount} Likes • {post.commentsCount} Comments
                                      </span>
                                              </div>
                                              {selectedPost && selectedPost._id === post._id && (
                                                  <div className="post-details">
                                                    <p><strong>Subject:</strong> {selectedPost.subject}</p>
                                                    <p><strong>Content:</strong> {selectedPost.content}</p>
                                                    <p><strong>Likes:</strong> {selectedPost.likesCount}</p>
                                                    <p><strong>Dislikes:</strong> {selectedPost.dislikesCount}</p>
                                                    <p><strong>Comments:</strong> {selectedPost.commentsCount}</p>
                                                    <p><strong>Reports:</strong> {selectedPost.reports?.length || 0}</p>
                                                    <p><strong>Posted by:</strong> {selectedPost.userId?.username || "Unknown"}</p>
                                                    <p><strong>Created:</strong> {new Date(selectedPost.createdAt).toLocaleString()}</p>
                                                    <div className="reports-section">
                                                      <p><strong>Reports:</strong></p>
                                                      {selectedPost.reports && selectedPost.reports.length > 0 ? (
                                                          <ul className="reports-list">
                                                            {selectedPost.reports.map((report, index) => (
                                                                <li key={index} className="report-item">
                                                                  <span><strong>Reported By:</strong> {report.userId?.username || "Unknown"}</span>
                                                                  <span><strong>Reason:</strong> {report.reason || "N/A"}</span>
                                                                  <span><strong>Details:</strong> {report.details || "No details provided"}</span>
                                                                </li>
                                                            ))}
                                                          </ul>
                                                      ) : (
                                                          <p className="no-data">No reports for this post</p>
                                                      )}
                                                    </div>
                                                    <button
                                                        className="delete-btn"
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          deleteGroupPost(group._id, post._id);
                                                        }}
                                                    >
                                                      🗑 Delete
                                                    </button>
                                                  </div>
                                              )}
                                            </React.Fragment>
                                        ))
                                    ) : (
                                        <span className="value">No posts yet</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="group-actions">
                                {editingGroupId !== group._id ? (
                                    <>
                                      <button onClick={() => startEditing(group)}>✏️ Edit</button>
                                      <button onClick={() => deleteGroup(group._id)}>🗑 Delete Group</button>
                                    </>
                                ) : (
                                    <>
                                      <button onClick={() => saveEditedGroup(group._id)}>💾 Save</button>
                                      <button onClick={cancelEditing}>❌ Cancel</button>
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
        )}
      </div>
  );
};

// ActivityManager Component (from Code 2, enhanced with Code 1 features)
const ActivityManager = ({ activities, setActivities }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const [editingActivityId, setEditingActivityId] = useState(null);
  const [editingData, setEditingData] = useState({
    title: "",
    description: "",
    category: "Workshop",
    date: new Date().toISOString().split("T")[0],
    location: "",
    isPaid: false,
    amount: 0,
    link: "",
    eventImage: null,
  });

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await fetch("http://localhost:5000/api/events", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const data = await response.json();
        setActivities(data);
      } catch (err) {
        setError({ text: "Failed to load activities", type: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 30000); // Reduced polling frequency
    return () => clearInterval(interval);
  }, [setActivities]);

  const fetchActivityDetails = async (activityId) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/events/${activityId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch activity details");
      }

      const data = await response.json();
      setSelectedActivity(data);
      setViewMode("details");
    } catch (err) {
      setError({ text: "Failed to load activity details", type: "error" });
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/events/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        setActivities((prev) => prev.filter((activity) => activity._id !== id));
        setError({ text: "🗑 Activity deleted successfully", type: "success" });
      } else {
        throw new Error("Failed to delete activity");
      }
    } catch (err) {
      console.error("Error deleting activity:", err);
      setError({ text: "Error deleting activity", type: "error" });
    }
  };

  const startEditing = (activity) => {
    setEditingActivityId(activity._id);
    setEditingData({
      title: activity.title,
      description: activity.description,
      category: activity.category,
      date: new Date(activity.date).toISOString().split("T")[0],
      location: activity.location,
      isPaid: activity.isPaid,
      amount: activity.amount || 0,
      link: activity.link || "",
      eventImage: null,
    });
  };

  const cancelEditing = () => {
    setEditingActivityId(null);
    setEditingData({
      title: "",
      description: "",
      category: "Workshop",
      date: new Date().toISOString().split("T")[0],
      location: "",
      isPaid: false,
      amount: 0,
      link: "",
      eventImage: null,
    });
  };

  const handleEditingChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setEditingData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : type === "file" ? files[0] : value,
      ...(name === "isPaid" && !checked && { amount: 0 }),
    }));
  };

  const saveEditedActivity = async (activityId) => {
    try {
      const token = localStorage.getItem("jwtToken");
      const formData = new FormData();
      Object.keys(editingData).forEach((key) => {
        if (key === "eventImage" && editingData[key]) {
          formData.append("image", editingData[key]);
        } else if (key !== "eventImage") {
          formData.append(key, editingData[key]);
        }
      });

      const url = activityId === "new"
          ? "http://localhost:5000/api/events"
          : `http://localhost:5000/api/events/${activityId}`;
      const method = activityId === "new" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setActivities((prev) => {
          if (activityId === "new") {
            return [data, ...prev];
          } else {
            return prev.map((a) => (a._id === data._id ? data : a));
          }
        });
        setEditingActivityId(null);
        setError({ text: activityId === "new" ? "➕ Activity created successfully" : "💾 Activity updated successfully", type: "success" });
      } else {
        throw new Error(data.message || "Error saving activity");
      }
    } catch (error) {
      console.error("Error saving activity:", error);
      setError({ text: "Error saving activity", type: "error" });
    }
  };

  const showDetails = (activity) => {
    fetchActivityDetails(activity._id);
  };

  const handleBackToList = () => {
    setViewMode("table");
    setSelectedActivity(null);
  };

  if (loading) {
    return <div className="loading">⏳ Loading activities...</div>;
  }

  if (viewMode === "details" && selectedActivity) {
    return (
        <div className="activity-details-admin section-content">
          <button onClick={handleBackToList} className="back-button">
            ← Back to Activities
          </button>
          <h2>{selectedActivity.title}</h2>
          <div className="activity-info skill-card">
            <div className="detail-row">
              <span className="detail-label">Description:</span>
              <span className="detail-value">{selectedActivity.description}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Category:</span>
              <span className="detail-value">{selectedActivity.category}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Date:</span>
              <span className="detail-value">{new Date(selectedActivity.date).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{selectedActivity.location || "Virtual"}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">
              {selectedActivity.isPaid ? `Paid ($${selectedActivity.amount})` : "Free"}
            </span>
            </div>
            {selectedActivity.link && (
                <div className="detail-row">
                  <span className="detail-label">Link:</span>
                  <span className="detail-value">
                <a href={selectedActivity.link} target="_blank" rel="noopener noreferrer">
                  {selectedActivity.link}
                </a>
              </span>
                </div>
            )}
            <div className="detail-row">
              <span className="detail-label">Created By:</span>
              <span className="detail-value">{selectedActivity.createdBy?.username || "Unknown"}</span>
            </div>
            <div className="participants-section">
              <h3>Participants</h3>
              {selectedActivity.participants?.length > 0 ? (
                  <ul className="simple-list">
                    {selectedActivity.participants.map((participant, index) => (
                        <li key={index} className="list-item">
                          {participant.username || "Anonymous"}
                          {participant.email && (
                              <span className="subtle-text"> ({participant.email})</span>
                          )}
                        </li>
                    ))}
                  </ul>
              ) : (
                  <p className="no-data">No participants yet</p>
              )}
            </div>
            <div className="ratings-section">
              <h3>Ratings</h3>
              <p className="average-rating">
                Average Rating: {selectedActivity.averageRating || "N/A"} ({selectedActivity.ratings.length} total)
              </p>
              {selectedActivity.ratings?.length > 0 ? (
                  <ul className="simple-list">
                    {selectedActivity.ratings.map((rating, index) => (
                        <li key={index} className="list-item">
                          <span>{rating.userId?.username || "Anonymous"}: {rating.rating}/5</span>
                          <span className="subtle-text">
                      {" "}— {new Date(rating.createdAt).toLocaleDateString()}
                    </span>
                        </li>
                    ))}
                  </ul>
              ) : (
                  <p className="no-data">No ratings yet</p>
              )}
            </div>
            <div className="comments-section">
              <h3>Comments</h3>
              {selectedActivity.comments?.length > 0 ? (
                  <ul className="simple-list">
                    {selectedActivity.comments.map((comment, index) => (
                        <li key={index} className="list-item">
                    <span>
                      <strong>{comment.userId?.username || "Anonymous"}:</strong> {comment.text}
                    </span>
                          <span className="subtle-text">
                      {" "}— {new Date(comment.createdAt).toLocaleDateString()}
                            {comment.updatedAt && ` (Edited: ${new Date(comment.updatedAt).toLocaleDateString()})`}
                    </span>
                        </li>
                    ))}
                  </ul>
              ) : (
                  <p className="no-data">No comments yet</p>
              )}
            </div>
            {selectedActivity.eventImage?.filename && (
                <div className="activity-image user-image-container">
                  <img
                      src={`http://localhost:5000/uploads/${selectedActivity.eventImage.filename}`}
                      alt={selectedActivity.title}
                  />
                </div>
            )}
          </div>
        </div>
    );
  }

  return (
      <div className="skill-manager">
        {error && (
            <Message
                message={error.text}
                type={error.type}
                onClose={() => setError(null)}
            />
        )}
        <h3>Activities List</h3>
        <table className="skill-table">
          <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Date</th>
            <th>Location</th>
            <th>Type</th>
            <th>Created By</th>
            <th>Participants</th>
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
                        {["Workshop", "Webinar", "Meetup", "Training"].map((opt) => (
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
                      activity.location || "Virtual"
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
                      activity.isPaid ? `💰 $${activity.amount}` : "Free"
                  )}
                </td>
                <td>
                  {activity.createdBy?.username || "Unknown"}
                </td>
                <td>
                  {activity.participants?.length > 0 ? (
                      <ul className="participants-list">
                        {activity.participants.slice(0, 3).map((participant, index) => (
                            <li key={index}>{participant.username || "Anonymous"}</li>
                        ))}
                        {activity.participants.length > 3 && (
                            <li>+{activity.participants.length - 3} more</li>
                        )}
                      </ul>
                  ) : (
                      "No participants"
                  )}
                </td>
                <td>
                  {editingActivityId === activity._id ? (
                      <>
                        <button onClick={() => saveEditedActivity(activity._id)}>💾</button>
                        <button onClick={cancelEditing}>❌</button>
                      </>
                  ) : (
                      <>
                        <button onClick={() => startEditing(activity)}>✏️</button>
                        <button onClick={() => handleDelete(activity._id)}>🗑</button>
                        <button
                            onClick={() => showDetails(activity)}
                            className="details-button"
                        >
                          Details
                        </button>
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

const TutorialManager = () => {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchTutorials = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        const response = await fetch("http://localhost:5000/api/admin/tutorials", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setTutorials(data);
        } else {
          showMessage("Failed to fetch tutorials", "error");
        }
      } catch (err) {
        console.error("Error fetching tutorials:", err);
        showMessage("Error fetching tutorials", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTutorials();
    const interval = setInterval(fetchTutorials, 30000);
    return () => clearInterval(interval);
  }, []);

  const showMessage = (text, type = "success") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleDeleteTutorial = async (tutorialId) => {
    if (!window.confirm("Are you sure you want to delete this tutorial?")) return;
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(`http://localhost:5000/api/admin/tutorials/${tutorialId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setTutorials(tutorials.filter((tutorial) => tutorial.tutorialId !== tutorialId));
        showMessage("🗑 Tutorial deleted successfully");
      } else {
        const data = await response.json();
        showMessage(data.message || "Error deleting tutorial", "error");
      }
    } catch (err) {
      console.error("Error deleting tutorial:", err);
      showMessage("Error deleting tutorial", "error");
    }
  };

  return (
      <div className="tutorial-manager">
        {message && (
            <Message
                message={message.text}
                type={message.type}
                onClose={() => setMessage(null)}
            />
        )}
        {loading ? (
            <div className="loading">⏳ Loading tutorials...</div>
        ) : (
            <>
              <h3>Tutorial List</h3>
              <table className="skill-table">
                <thead>
                <tr>
                  <th>Title</th>
                  <th>Content</th>
                  <th>Category</th>
                  <th>Created By</th>
                  <th>Likes</th>
                  <th>Comments</th>
                  <th>Created At</th>
                  <th>Actions</th>
                </tr>
                </thead>
                <tbody>
                {tutorials.map((tutorial) => (
                    <tr key={tutorial._id}>
                      <td>{tutorial.title}</td>
                      <td>{tutorial.content.substring(0, 50)}...</td>
                      <td>{tutorial.category || "N/A"}</td>
                      <td>{tutorial.authorId?.username || "N/A"}</td>
                      <td>{tutorial.likesCount || 0}</td>
                      <td>{tutorial.commentsCount || 0}</td>
                      <td>{new Date(tutorial.createdAt).toLocaleString()}</td>
                      <td>
                        <button onClick={() => handleDeleteTutorial(tutorial.tutorialId)}>🗑</button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </>
        )}
      </div>
  );
};
// Main AdminDashboard Component
const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("statistics");
  const [darkMode, setDarkMode] = useState(false);
  const [statsData, setStatsData] = useState(defaultStatsData);
  const [tutorialStats, setTutorialStats] = useState({
    totalTutorials: 0,
    engagementMetrics: []
  });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [jobOffers, setJobOffers] = useState([]); // Contient les offres d'emploi
const [jobLoading, setJobLoading] = useState(true); // Indicateur de chargement des offres d'emploi
const [jobError, setJobError] = useState(null); // Erreur de récupération des offres d'emploi
const [selectedJob, setSelectedJob] = useState(null); // Offre d'emploi sélectionnée
const [applications, setApplications] = useState([]); // Contient les candidatures pour une offre
const [skillsData, setSkillsData] = useState([]); // Contient les compétences populaires
const [skillsError, setSkillsError] = useState(null); // Erreur de récupération des compétences
const [loadingSkills, setLoadingSkills] = useState(false); // Indicateur de chargement des compétences populaires
const [skillsMap, setSkillsMap] = useState({}); // Déclare skillsMap
const [message, setMessage] = useState(null);
const showMessage = (text, type = "success") => {
  setMessage({ text, type });
  setTimeout(() => setMessage(null), 5000); // Ferme le message après 5 secondes
};

useEffect(() => {
  async function fetchSkills() {
    try {
      const response = await fetch("http://localhost:5000/api/admin/skills");
      if (response.ok) {
        const data = await response.json();
        const map = {};
        // Créer un objet skillsMap où chaque skill ID est une clé et son nom est la valeur
        data.forEach(skill => {
          map[skill._id] = skill.name;
        });
        setSkillsMap(map); // Met à jour l'état skillsMap
      }
    } catch (err) {
      console.error("Erreur lors de la récupération des compétences", err);
    }
  }

  fetchSkills(); // Appel de la fonction fetchSkills lors du montage du composant
}, []);
const getSkillNames = (skills) => {
  return skills?.map(id => skillsMap[id] || id).join(', ') || 'N/A';
  };

  useEffect(() => {
    const storedDarkMode = localStorage.getItem("darkMode");
    if (storedDarkMode === "true") {
      setDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) {
          throw new Error("No JWT token found");
        }
        const [
          dashboardStatsResponse,
          groupStatsResponse,
          activityStatsResponse,
          trendingActivitiesResponse,
          tutorialStatsResponse
        ] = await Promise.all([
          fetch("http://localhost:5000/api/admin/dashboard-stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/admin/groups/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/events/category-stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/events/trending", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/api/admin/tutorials/dynamic-stats", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (!dashboardStatsResponse.ok) throw new Error("Failed to fetch dashboard statistics");
        if (!groupStatsResponse.ok) throw new Error("Failed to fetch group statistics");
        if (!activityStatsResponse.ok) throw new Error("Failed to fetch activity statistics");
        if (!trendingActivitiesResponse.ok) throw new Error("Failed to fetch trending activities");
        if (!tutorialStatsResponse.ok) throw new Error("Failed to fetch tutorial statistics");

        const dashboardData = await dashboardStatsResponse.json();
        const groupData = await groupStatsResponse.json();
        const activityStatsData = await activityStatsResponse.json();
        const trendingActivitiesData = await trendingActivitiesResponse.json();
        const tutorialData = await tutorialStatsResponse.json();

        const cleanedData = {
          users: {
            total: dashboardData.users.total,
            roles: dashboardData.users.roles.map((role) => ({
              ...role,
              count: Math.floor(role.count),
            })),
          },
          courses: {
            total: 0,
            categories: [
              { name: "Technical", value: 0 },
              { name: "Business", value: 0 },
              { name: "Design", value: 0 },
              { name: "Other", value: 0 },
            ],
          },
          skills: {
            total: dashboardData.skills.total,
            trending: dashboardData.skills.trending,
          },
          groups: {
            totalGroups: groupData.totalGroups,
            totalPosts: groupData.totalPosts,
            totalComments: groupData.totalComments,
            totalLikes: groupData.totalLikes,
            totalDislikes: groupData.totalDislikes,
            groupActivityOverTime: groupData.groupActivityOverTime,
            mostActiveGroups: groupData.mostActiveGroups,
            privacyDistribution: groupData.privacyDistribution,
            avgEngagementPerPost: groupData.avgEngagementPerPost,
            topGroupsByMembers: groupData.topGroupsByMembers,
          },
          activities: {
            total: activityStatsData.total,
            categories: activityStatsData.categories,
            trending: trendingActivitiesData.filter(activity => activity.averageRating > 0),
          },
          tutorials: {
            totalTutorials: tutorialData.totalTutorials,
            engagementMetrics: tutorialData.engagementMetrics
          }
        };

        setStatsData(cleanedData);
        setTutorialStats({
          totalTutorials: tutorialData.totalTutorials,
          engagementMetrics: tutorialData.engagementMetrics
        });
        setError(null);
      } catch (err) {
        console.error("Error fetching stats:", err);
        setError("Failed to load statistics. Using default data.");
        setStatsData(defaultStatsData);
      } finally {
        setLoading(false);
      }
    };

    if (activeSection === "statistics") {
      fetchStats();
      const interval = setInterval(fetchStats, 30000); // Reduced polling frequency
      return () => clearInterval(interval);
    }
  }, [activeSection]);

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
  const fetchJobOffers = async () => {
    try {
      setJobLoading(true);
      const response = await fetch("http://localhost:5000/api/recruitment/job-offers");
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      if (!Array.isArray(data)) throw new Error("Data format error: Expected an array");
      setJobOffers(data);
      setStatsData((prevStats) => ({
        ...prevStats,
        jobs: {
          total: data.length,
          open: data.filter(job => job.status === "open").length,
          closed: data.filter(job => job.status === "closed").length,
        },
      }));
    } catch (err) {
      console.error("Error fetching job offers:", err);
      setJobError("An error occurred while fetching job offers.");
    } finally {
      setJobLoading(false);
    }
  };
  
   
    useEffect(() => {
      fetchJobOffers(); // Charger les jobs dès le montage
    }, []);
    useEffect(() => {
      if (activeSection === "jobs" || activeSection === "statistics") {
        fetchJobOffers(); // Actualiser les offres d'emploi si on est sur la page Jobs ou Statistics
      }
    }, [activeSection]);
      
    const fetchMostDemandedSkills = async () => {
      try {
        setLoadingSkills(true);
        // Récupération des offres d'emploi
        const response = await axios.get("http://localhost:5000/api/recruitment/job-offers");
        if (response.status === 200) {
          const jobOffers = response.data;
    
          const skillCounts = {};
    
          // Compter les occurrences des compétences
          jobOffers.forEach((job) => {
            job.requiredSkills.forEach((skill) => {
              if (skillCounts[skill]) {
                skillCounts[skill] += 1;
              } else {
                skillCounts[skill] = 1;
              }
            });
          });
    
        // Obtenir les noms des compétences depuis les IDs
        const skillIds = Object.keys(skillCounts);
        const skillNamesResponse = await axios.get(`http://localhost:5000/api/admin/skills`);
  
        if (skillNamesResponse.status === 200) {
          const skillNamesMap = {};
          skillNamesResponse.data.forEach((skill) => {
            skillNamesMap[skill._id] = skill.name;
          });
  
          // Préparer les données pour le diagramme
          const sortedSkills = Object.entries(skillCounts)
            .map(([skillId, count]) => ({
              name: skillNamesMap[skillId] || skillId,
              value: count,
            }))
            .sort((a, b) => b.value - a.value);
  
          setSkillsData(sortedSkills); // Mettez à jour les compétences populaires
          setSkillsError(null); // Pas d'erreur
        } else {
          setSkillsError("Erreur lors de la récupération des noms de compétences.");
        }
      } else {
        setSkillsError("Erreur lors de la récupération des compétences.");
      }
    } catch (error) {
      setSkillsError("Erreur lors de la récupération des compétences.");
      console.error("Erreur lors de la récupération des compétences:", error);
    } finally {
      setLoadingSkills(false); // Terminé le chargement des compétences populaires
    }
  };
  const fetchJobDetails = (jobId) => {
    const url = currentUser.role === 'admin' 
      ? `http://localhost:5000/api/recruitment/job-offers/${jobId}/applications` 
      : `http://localhost:5000/api/recruitment/job-offers/${jobId}`;
  
    axios.get(url, {
      params: { userId: currentUser._id, role: currentUser.role }
    })
      .then(res => {
        if (currentUser.role === 'admin') {
          console.log('Admin applications response:', res.data);
          setApplications(res.data.applications || []);
        } else {
          console.log('User job details response:', res.data);
          setSelectedJob(res.data.jobOffer);
          if (res.data.applications) setApplications(res.data.applications);
        }
      })
      .catch(err => console.error('Error fetching job details:', err));
  };


  useEffect(() => {
    if (activeSection === "statistics") {
      fetchMostDemandedSkills(); // Récupérer les compétences les plus demandées
    }
  }, [activeSection]);
  
 
          
  const handleJobRowClick = async (id) => {
    if (selectedJob && selectedJob._id === id) {
        setSelectedJob(null);
        setApplications([]); // Réinitialiser les applications
        return;
    }
    try {
        const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
        const response = await fetch(`http://localhost:5000/api/recruitment/job-offers/${id}`, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            method: 'GET',
        });

        if (response.ok) {
            const data = await response.json();
            setSelectedJob(data.jobOffer);

            // Vérifier si l'utilisateur connecté est l'admin ou celui qui a posté l'offre
            if (currentUser.role === 'admin' || data.jobOffer.postedBy._id === currentUser._id) {
                setApplications(data.applications || []);  // Récupération des candidatures
            } else {
                setApplications([]);  // Si l'utilisateur n'est pas autorisé
            }
        } else {
            console.error("Error fetching job details:", response.statusText);
        }
    } catch (err) {
        console.error("Error fetching job details:", err);
    }
};
 











  const renderSection = () => {
    switch (activeSection) {
      case "statistics":
        return (
            <div className="section-content">
              <h2>Overview Statistics</h2>
              <Statistics
                  statsData={statsData}
                  tutorialStats={tutorialStats}
                  loading={loading}
                  error={error}
              />
              {loading ? (
                  <p>Loading statistics...</p>
              ) : error ? (
                  <p className="error-message">{error}</p>
              ) : (
                  <>
                    <div className="stats-grid">
                      <div className="stats-card">
                        <h3>Users Overview</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart data={statsData.users.roles}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="role" />
                            <YAxis tickFormatter={(value) => Math.floor(value)} />
                            <Tooltip formatter={(value) => Math.floor(value)} />
                            <Legend />
                            <Bar dataKey="count" fill="var(--primary-color)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                     <div className="stats-card">
                                   <h3>Jobs Overview</h3>
                                   <ResponsiveContainer width="100%" height={250}>
                                     <BarChart data={[
                                       { status: "Open", count: jobOffers.filter(job => job.status === "open").length },
                                       { status: "Closed", count: jobOffers.filter(job => job.status === "closed").length },
                                     ]}>
                                       <CartesianGrid strokeDasharray="3 3" />
                                       <XAxis dataKey="status" />
                                       <YAxis allowDecimals={false} />
                                       <Tooltip />
                                       <Legend />
                                       <Bar dataKey="count" fill="#a6792e" />
                                     </BarChart>
                                   </ResponsiveContainer>
                                 </div>
    <div className="stats-card">
  <h3>Trending Skills in Job Offers</h3>
  {loadingSkills ? (
    <p>Loading trending skills...</p>
  ) : skillsError ? (
    <p className="error-message">{skillsError}</p>
  ) : skillsData && skillsData.length > 0 ? (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={skillsData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={80}
          fill="#8884d8"
          label={({ name, value }) => `${name}: ${value}`}
        >
          {skillsData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={['#c2b280', '#6f4e37', '#cfa54b'][index % 3]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  ) : (
    <p>No trending skills available.</p>
  )}
</div>

                      <div className="stats-card">
                        <h3>Activity Categories</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                                data={statsData.activities.categories}
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
                        <div className="metric-box">
                          <h4>Total Activities</h4>
                          <p className="metric-value">{statsData.activities.total}</p>
                        </div>
                        <div 
                className="metric-box" 
                style={{ 
                  textAlign: "center", 
                  fontSize: "1.5rem", 
                  fontWeight: "bold", 
                  color: "#333", 
                  margin: "20px", 
                  lineHeight: "1.2"
                }}
              >
                <div 
                  style={{ 
                    fontSize: "1.2rem", 
                    marginBottom: "5px" 
                  }}
                >
                  Total Jobs
                </div>
                <div 
                  style={{ 
                    fontSize: "2.5rem", 
                    color: "#a6792e" 
                  }}
                >
                  {jobOffers.length}
                </div>
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
                      <div className="stats-card">
                        <h3>Trending Activities</h3>
                        <ul className="trending-list">
                          {statsData.activities.trending.map((activity, index) => (
                              <li key={activity._id} className="trending-item">
                                <span className="trending-rank">#{index + 1}</span>
                                {activity.title} (Rating: {activity.averageRating})
                              </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <h2 className="group-stats-header">Group Statistics</h2>
                    <div className="stats-grid">
                      <div className="stats-card metric-group">
                        <div className="metric-box">
                          <h4>Total Groups</h4>
                          <p className="metric-value">{statsData.groups.totalGroups}</p>
                        </div>
                        <div className="metric-box">
                          <h4>Total Posts</h4>
                          <p className="metric-value">{statsData.groups.totalPosts}</p>
                        </div>
                        <div className="metric-box">
                          <h4>Avg Engagement/Post</h4>
                          <p className="metric-value">{statsData.groups.avgEngagementPerPost}</p>
                        </div>
                      </div>
                      <div className="stats-card">
                        <h3>Group Activity (Last 30 Days)</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <LineChart data={statsData.groups.groupActivityOverTime}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="_id" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="posts" stroke="var(--primary-color)" name="Posts" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="stats-card">
                        <h3>Group Privacy Distribution</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <PieChart>
                            <Pie
                                data={statsData.groups.privacyDistribution}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                fill="var(--primary-color)"
                                label={({ name, value }) => `${name}: ${value}`}
                            />
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="stats-card">
                        <h3>Engagement Metrics</h3>
                        <ResponsiveContainer width="100%" height={250}>
                          <BarChart
                              data={[
                                { name: "Likes", value: statsData.groups.totalLikes },
                                { name: "Dislikes", value: statsData.groups.totalDislikes },
                                { name: "Comments", value: statsData.groups.totalComments },
                              ]}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="var(--accent-color)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="stats-card">
                        <h3>Top Groups by Members</h3>
                        <ul className="trending-list">
                          {statsData.groups.topGroupsByMembers.map((group, index) => (
                              <li key={index} className="trending-item">
                                <span className="trending-rank">#{index + 1}</span>
                                {group.name} ({group.memberCount} members)
                              </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </>
              )}
            </div>
        );
      case "tutorials":
        return (
            <div className="section-content">
              <h2>Tutorials</h2>
              <TutorialManager />
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
          {jobLoading ? (
            <p>Loading job offers...</p>
          ) : jobError ? (
            <p className="error-message">{jobError}</p>
          ) : (
            <>
              {/* Compteur de jobs */}
              <div className="job-counter">
                <h3>Total Jobs: {jobOffers.length}</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Posted By</th>
                    <th>Location</th>
                    <th>Date Posted</th>
                    <th>Status</th>
                    <th>Details (👇 Click to expand)</th>
                  </tr>
                </thead>
                <tbody>
                  {jobOffers.length === 0 ? (
                    <tr>
                      <td colSpan="6">No job offers found.</td>
                    </tr>
                  ) : (
                    jobOffers.map((job) => (
                      <React.Fragment key={job._id}>
                        <tr>
                          <td>{job.title}</td>
                          <td>{job.postedBy?.username || "Unknown"}</td>
                          <td>{job.location || "N/A"}</td>
                          <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                          <td>{job.status || "N/A"}</td>
                          <td
                            onClick={() => handleJobRowClick(job._id)}
                            style={{ cursor: "pointer", color: "rgb(78, 49, 6)" }}
                          >
                            👇 Click to expand
                          </td>
                        </tr>
                        {selectedJob && selectedJob._id === job._id && (
                          <tr className="expanded">
                            <td colSpan="6">
                              <div className="expanded-job-details">
                                <h2>{selectedJob.title}</h2>
                                <p><strong>Description:</strong> {selectedJob.description}</p>
                                <p><strong>Location:</strong> {selectedJob.location || 'N/A'}</p>
                                <p><strong>City:</strong> {selectedJob.city || 'N/A'}</p>
                                <p><strong>Experience Level:</strong> {selectedJob.experienceLevel}</p>
                                <p><strong>Job Type:</strong> {selectedJob.jobType}</p>
                                <p><strong>Salary Range:</strong> {selectedJob.salaryRange || 'N/A'}</p>
                                <p><strong>Required Skills:</strong> {getSkillNames(selectedJob.requiredSkills)}</p>
                                <p><strong>Posted By:</strong> {selectedJob.postedBy?.username || 'N/A'}</p>
                                <p><strong>Status:</strong> {selectedJob.status || 'N/A'}</p>
                                <div className="job-actions">
       
                              </div>


                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      );
    
            
      case "groups":
        return (
            <div className="section-content">
              <h2>Groups</h2>
              <GroupManager />
            </div>
        );
      case "events":
        return (
            <div className="section-content">
              <h2>Add New Activity</h2>
              <AddActivityBack onAddActivity={handleAddActivity} />
              <h2>Manage Activities</h2>
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
                    className={activeSection === "tutorials" ? "active" : ""}
                    onClick={() => setActiveSection("tutorials")}
                >
                  📝 Tutorials
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

      </>
  );
};

export default AdminDashboard;