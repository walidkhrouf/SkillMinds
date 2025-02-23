import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkill, setSelectedSkill] = useState("");
  const [editing, setEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [error, setError] = useState("");
  const [setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setEditedUser(parsedUser);
      fetchUserSkills(parsedUser._id);
      fetchNotifications(parsedUser._id);
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/users/skills")
      .then((res) => res.json())
      .then((data) => setAvailableSkills(data))
      .catch((err) => console.error("Error fetching available skills:", err));
  }, []);

  const fetchUserSkills = (userId) => {
    fetch(`http://localhost:5000/api/users/userskills?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        const hasSkills = data.filter((us) => us.skillType === "has");
        setUserSkills(hasSkills);
      })
      .catch((err) => console.error("Error fetching user skills:", err));
  };

  const fetchNotifications = (userId) => {
    fetch(`http://localhost:5000/api/notifications?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => setNotifications(data))
      .catch((err) => console.error("Error fetching notifications:", err));
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/users/userskills/${skillId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUserSkills((prev) => prev.filter((us) => us._id !== skillId));
        fetchNotifications(user._id);
      } else {
        console.error("Failed to delete skill.");
      }
    } catch (error) {
      console.error("Error deleting skill:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("jwtToken");
    navigate("/");
  };

  const toggleEditing = () => {
    if (editing) {
      setEditedUser(user);
      setNewProfileImage(null);
      setError("");
    }
    setEditing(!editing);
  };

  const handleInputChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
    setError("");
  };

  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfileImage(e.target.files[0]);
    }
  };

  const handleSkillSelect = (e) => {
    setSelectedSkill(e.target.value);
  };

  const handleAddSkill = async () => {
    if (!selectedSkill || !user) return;
    try {
      const res = await fetch("http://localhost:5000/api/users/userskills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user._id,
          skills: [{ skillId: selectedSkill, skillType: "has" }],
        }),
      });
      if (res.ok) {
        const result = await res.json();
        setUserSkills((prevSkills) => [...prevSkills, ...result.userSkills]);
        fetchNotifications(user._id);
      } else {
        setError("Failed to add skill.");
      }
    } catch (error) {
      console.error("Error adding skill:", error);
      setError("Error adding skill.");
    }
  };

  const validateFields = () => {
    const { username, email, location, phoneNumber, bio } = editedUser;
    if (!username || username.trim() === "") return "Username cannot be empty.";
    if (!email || email.trim() === "") return "Email cannot be empty.";
    if (!email.includes("@")) return "Email must contain '@'.";
    if (!location || location.trim() === "") return "Location cannot be empty.";
    if (!phoneNumber || phoneNumber.trim() === "") return "Phone number cannot be empty.";
    if (phoneNumber.trim().length < 8) return "Phone number must be at least 8 digits.";
    if (!bio || bio.trim() === "") return "Bio cannot be empty.";
    return null;
  };

  const handleSave = async () => {
    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }
    try {
      let response;
      if (newProfileImage) {
        const formData = new FormData();
        formData.append("username", editedUser.username);
        formData.append("email", editedUser.email);
        formData.append("location", editedUser.location);
        formData.append("phoneNumber", editedUser.phoneNumber);
        formData.append("bio", editedUser.bio);
        formData.append("profileImage", newProfileImage);
        response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        response = await fetch(`http://localhost:5000/api/users/${user._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editedUser),
        });
      }

      if (response.ok) {
        const updatedUser = await response.json();
        setUser(updatedUser);
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        setEditing(false);
        setNewProfileImage(null);
        fetchUserSkills(updatedUser._id);
        fetchNotifications(updatedUser._id);
        window.location.reload();
      } else {
        setError("Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Error updating profile.");
    }
  };

  if (!user) return <div>Loading profile...</div>;

  return (
    <div className="user-profile">
      <div
        className="profile-cover"
        style={{ backgroundImage: `url(${user.cover || "/images/cover.jpg"})` }}
      >
        <div className="cover-overlay"></div>
      </div>
      <div className="container profile-card">
        <div className="profile-header">
          <div className="profile-avatar-container">
            <img
              src={
                newProfileImage
                  ? URL.createObjectURL(newProfileImage)
                  : user.profileImage && user.profileImage.fileId
                  ? `http://localhost:5000/api/files/${user.profileImage.fileId}?t=${Date.now()}`
                  : "/images/avatar.png"
              }
              alt="Profile"
              className="profile-avatar"
            />
            {editing && (
              <input
                type="file"
                name="profileImage"
                onChange={handleProfileImageChange}
                className="file-input"
              />
            )}
          </div>
          <div className="profile-info">
            {editing ? (
              <>
                <input
                  type="text"
                  name="username"
                  value={editedUser.username || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Username"
                />
                <input
                  type="email"
                  name="email"
                  value={editedUser.email || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Email"
                />
                <input
                  type="text"
                  name="location"
                  value={editedUser.location || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Location"
                />
                <input
                  type="text"
                  name="phoneNumber"
                  value={editedUser.phoneNumber || ""}
                  onChange={handleInputChange}
                  className="profile-input"
                  placeholder="Phone Number"
                />
              </>
            ) : (
              <>
                <h1 className="profile-name">{user.username}</h1>
                <p className="profile-role">{user.role}</p>
                <p className="profile-email">{user.email}</p>
                <p className="profile-location">{user.location}</p>
                <p className="profile-phone">{user.phoneNumber}</p>
                <p className="profile-joined">
                  Member since: {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="profile-bio">
          <h2>About Me</h2>
          {editing ? (
            <textarea
              name="bio"
              value={editedUser.bio || ""}
              onChange={handleInputChange}
              className="profile-textarea"
              placeholder="Tell us about yourself..."
            />
          ) : (
            <p>{user.bio}</p>
          )}
        </div>

        <div className="profile-skills">
          <h2>My Skills</h2>
          <ul>
            {userSkills.length > 0 ? (
              userSkills.map((us) => (
                <li key={us._id} className="skill-item">
                  {us.skillId.name}{" "}
                  <span className="verification-status">
                    ({us.verificationStatus})
                  </span>
                  {editing && (
                    <button
                      className="remove-skill-btn"
                      onClick={() => handleRemoveSkill(us._id)}
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))
            ) : (
              <p>No skills added yet.</p>
            )}
          </ul>
          {editing && (
            <div className="add-skill">
              <select onChange={handleSkillSelect} value={selectedSkill}>
                <option value="">Select a skill</option>
                {availableSkills.map((skill) => (
                  <option key={skill._id} value={skill._id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <button onClick={handleAddSkill}>Add Skill</button>
            </div>
          )}
        </div>

        <div className="profile-details">
          <h2>Additional Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <h3>Certifications</h3>
              <p>{user.certifications || "No certifications added yet."}</p>
            </div>
            <div className="detail-item">
              <h3>Experience</h3>
              <p>{user.experience || "Experience details not provided."}</p>
            </div>
            <div className="detail-item">
              <h3>Projects</h3>
              <p>{user.projects || "Project details not provided."}</p>
            </div>
          </div>
        </div>

        {error && <p className="error-message">{error}</p>}

        <div className="profile-actions">
          {editing ? (
            <button onClick={handleSave} className="modify-btn">
              Save
            </button>
          ) : (
            <button onClick={toggleEditing} className="modify-btn">
              Modify Profile
            </button>
          )}
          <button onClick={handleLogout} className="profile-logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;