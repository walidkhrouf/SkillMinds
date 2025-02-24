import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [selectedSkillsHas, setSelectedSkillsHas] = useState([]);
  const [selectedSkillsWants, setSelectedSkillsWants] = useState([]);
  const [editing, setEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({});
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [lastFetchedTimestamp, setLastFetchedTimestamp] = useState(null);
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      fetchUserData(parsedUser._id);
    }
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/api/users/skills")
        .then((res) => res.json())
        .then((data) => {
          console.log("Available Skills:", data);
          setAvailableSkills(data);
        })
        .catch((err) =>
            console.error("Error fetching available skills:", err)
        );
  }, []);

  useEffect(() => {
    if (!user || editing) return;
    const pollUserData = () => {
      fetchUserData(user._id);
    };
    const intervalId = setInterval(pollUserData, 5000);
    return () => clearInterval(intervalId);
  }, [user, editing]);

  const fetchUserData = (userId) => {
    fetch(`http://localhost:5000/api/users/${userId}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((updatedUser) => {
          setUser(updatedUser);
          if (!editing) {
            setEditedUser(updatedUser);
          }
          localStorage.setItem("currentUser", JSON.stringify(updatedUser));
          fetchUserSkills(updatedUser._id);
          fetchNotifications(updatedUser._id);
        })
        .catch((err) =>
            console.error("Error fetching updated user:", err)
        );
  };

  const fetchUserSkills = (userId) => {
    fetch(`http://localhost:5000/api/users/userskills?userId=${userId}`)
        .then((res) => res.json())
        .then((data) => {
          const hasSkills = data.filter((us) => us.skillType === "has");
          const wantsSkills = data.filter((us) => us.skillType === "wantsToLearn");
          setUserSkills(data);
          if (!editing) {
            setSelectedSkillsHas(
                hasSkills.map((us) => us.skillId?._id).filter(Boolean)
            );
            setSelectedSkillsWants(
                wantsSkills.map((us) => us.skillId?._id).filter(Boolean)
            );
          }
        })
        .catch((err) =>
            console.error("Error fetching user skills:", err)
        );
  };

  const fetchNotifications = (userId) => {
    fetch(
        `http://localhost:5000/api/notifications?userId=${userId}&since=${
            lastFetchedTimestamp || ""
        }`,
        { cache: "no-store" }
    )
        .then((res) => res.json())
        .then((data) => {
          if (data.length > 0) {
            setNotifications((prev) => {
              const newNotifications = data.filter(
                  (newNotif) =>
                      !prev.some((oldNotif) => oldNotif._id === newNotif._id)
              );
              return [...newNotifications, ...prev];
            });
            const latestTimestamp = Math.max(
                ...data.map((n) => new Date(n.createdAt).getTime())
            );
            setLastFetchedTimestamp(latestTimestamp);
          }
        })
        .catch((err) =>
            console.error("Error fetching notifications:", err)
        );
  };

  const handleRemoveSkill = async (skillId) => {
    try {
      const res = await fetch(
          `http://localhost:5000/api/users/userskills/${skillId}`,
          { method: "DELETE" }
      );
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
      setPreviewImage(null);
      setError("");
    }
    setEditing(!editing);
  };

  const handleInputChange = (e) => {
    setEditedUser({ ...editedUser, [e.target.name]: e.target.value });
    setError("");
  };


  const handleImageDoubleClick = () => {
    if (!editing) {
      toggleEditing();
    }
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (e.g., JPG, PNG).");
        setNewProfileImage(null);
        setPreviewImage(null);
        return;
      }
      const previewURL = URL.createObjectURL(file);
      setNewProfileImage(file);
      setPreviewImage(previewURL);
      setError("");
    }
  };


  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
    };
  }, [previewImage]);

  const handleSkillToggle = (skillId, type) => {
    if (type === "has") {
      setSelectedSkillsHas((prev) =>
          prev.includes(skillId)
              ? prev.filter((id) => id !== skillId)
              : [...prev, skillId]
      );
    } else if (type === "wantsToLearn") {
      setSelectedSkillsWants((prev) =>
          prev.includes(skillId)
              ? prev.filter((id) => id !== skillId)
              : [...prev, skillId]
      );
    }
  };

  const validateFields = () => {
    const { username, email, location, phoneNumber, bio } = editedUser;
    if (!username || username.trim() === "")
      return "Username cannot be empty.";
    if (!email || email.trim() === "") return "Email cannot be empty.";
    if (!email.includes("@")) return "Email must contain '@'.";
    if (!location || location.trim() === "")
      return "Location cannot be empty.";
    if (!phoneNumber || phoneNumber.trim() === "")
      return "Phone number cannot be empty.";
    if (phoneNumber.trim().length < 8)
      return "Phone number must be at least 8 digits.";
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

        const skillsPayload = [
          ...selectedSkillsHas.map((skillId) => {
            const existing = userSkills.find(
                (us) =>
                    us.skillType === "has" &&
                    us.skillId &&
                    us.skillId._id === skillId
            );
            return {
              userSkillId:
                  Date.now().toString() +
                  Math.random().toString(36).substring(2, 15),
              skillId: skillId,
              skillType: "has",
              verificationStatus:
                  existing && existing.verificationStatus === "verified"
                      ? "verified"
                      : "unverified",
            };
          }),
          ...selectedSkillsWants.map((skillId) => {
            const existing = userSkills.find(
                (us) =>
                    us.skillType === "wantsToLearn" &&
                    us.skillId &&
                    us.skillId._id === skillId
            );
            return {
              userSkillId:
                  Date.now().toString() +
                  Math.random().toString(36).substring(2, 15),
              skillId: skillId,
              skillType: "wantsToLearn",
              verificationStatus:
                  existing && existing.verificationStatus === "verified"
                      ? "verified"
                      : "unverified",
            };
          }),
        ].filter((skill) => skill.skillId);

        console.log("Skills Payload:", skillsPayload);

        const skillsResponse = await fetch(
            "http://localhost:5000/api/users/userskills",
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userId: user._id, skills: skillsPayload }),
            }
        );

        const skillsResponseData = await skillsResponse.json();
        console.log("Skills Response:", skillsResponseData);

        if (skillsResponse.ok) {
          fetchUserSkills(user._id);
          fetchNotifications(user._id);
        } else {
          console.error("Failed to update skills:", skillsResponseData);
          setError(skillsResponseData.message || "Failed to update skills.");
          return;
        }

        setEditing(false);
        setNewProfileImage(null);
        setPreviewImage(null);
      } else {
        setError("Failed to update profile.");
      }
    } catch (error) {
      console.error("Error updating profile or skills:", error);
      setError("Error updating profile or skills: " + error.message);
    }
  };

  if (!user) return <div>Loading profile...</div>;

  const hasSkills = userSkills.filter((us) => us.skillType === "has");
  const wantsToLearnSkills = userSkills.filter(
      (us) => us.skillType === "wantsToLearn"
  );

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
                    previewImage
                        ? previewImage
                        : user.profileImage && user.profileImage.fileId
                            ? `http://localhost:5000/api/files/${user.profileImage.fileId}?t=${Date.now()}`
                            : "/images/avatar.png"
                  }
                  alt="Profile"
                  className="profile-avatar"
                  onDoubleClick={handleImageDoubleClick}
              />
              {/*

            */}
              <input
                  type="file"
                  name="profileImage"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleProfileImageChange}
                  style={{ display: "none" }}
              />
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
                      Member since:{" "}
                      {new Date(user.createdAt).toLocaleDateString()}
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

          {editing ? (
              <div className="profile-skills">
                <h2>Select Your Skills</h2>
                <div className="skills-selection">
                  <div className="skill-section">
                    <h3>Select Skills You Have:</h3>
                    <ul className="skills-pill-list">
                      {availableSkills.map((skill) => (
                          <li
                              key={skill._id}
                              className={`skill-pill ${
                                  selectedSkillsHas.includes(skill._id) ? "selected" : ""
                              }`}
                              onClick={() => handleSkillToggle(skill._id, "has")}
                          >
                            {skill.name}
                          </li>
                      ))}
                    </ul>
                  </div>
                  <div className="skill-section">
                    <h3>Select Skills You Want to Learn:</h3>
                    <ul className="skills-pill-list">
                      {availableSkills.map((skill) => (
                          <li
                              key={skill._id}
                              className={`skill-pill ${
                                  selectedSkillsWants.includes(skill._id) ? "selected" : ""
                              }`}
                              onClick={() => handleSkillToggle(skill._id, "wantsToLearn")}
                          >
                            {skill.name}
                          </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
          ) : (
              <>
                <div className="profile-skills">
                  <h2>My Skills</h2>
                  {hasSkills.length > 0 ? (
                      <ul>
                        {hasSkills.map((us) => (
                            <li key={us._id} className="skill-item">
                              {us.skillId ? us.skillId.name : "Skill no longer available"}{" "}
                              <span className="verification-status">
                        ({us.verificationStatus})
                      </span>
                            </li>
                        ))}
                      </ul>
                  ) : (
                      <p>No skills added yet.</p>
                  )}
                </div>
                <div className="profile-skills-wants">
                  <h2>Skills I Want to Learn</h2>
                  {wantsToLearnSkills.length > 0 ? (
                      <ul>
                        {wantsToLearnSkills.map((us) => (
                            <li key={us._id} className="skill-item">
                              {us.skillId ? us.skillId.name : "Skill no longer available"}
                            </li>
                        ))}
                      </ul>
                  ) : (
                      <p>No skills added yet.</p>
                  )}
                </div>
              </>
          )}

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
