import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./UserProfile.css";

const UserProfile = () => {
  const [user, setUser] = useState(null);
  const [userSkills, setUserSkills] = useState([]); 
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetch(`http://localhost:5000/api/users/userskills?userId=${parsedUser._id}`)
        .then((res) => res.json())
        .then((data) => {
          setUserSkills(data);
        })
        .catch((err) => console.error("Error fetching user skills:", err));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    navigate("/signin");
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
          {/* Show profile image from server if available */}
          <img
            src={
              user.profileImage && user.profileImage.fileId
                ? `http://localhost:5000/api/files/${user.profileImage.fileId}?t=${Date.now()}`
                : "/images/avatar.png"
            }
            alt="Profile"
            className="profile-avatar"
          />
          <div className="profile-info">
            <h1 className="profile-name">{user.username}</h1>
            <p className="profile-role">{user.role}</p>
            <p className="profile-email">{user.email}</p>
            <p className="profile-location">{user.location}</p>
            <p className="profile-phone">{user.phoneNumber}</p>
            <p className="profile-joined">
              Member since: {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="profile-bio">
          <h2>About Me</h2>
          <p>{user.bio}</p>
        </div>

        <div className="profile-skills">
          <h2>My Skills</h2>
          <ul>
            {userSkills.length > 0 ? (
              userSkills.map((us) => (
                <li key={us._id} className="skill-item">
                  {us.skillId.name} 
                </li>
              ))
            ) : (
              <p>No skills added yet.</p>
            )}
          </ul>
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
        <div className="profile-actions">
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
