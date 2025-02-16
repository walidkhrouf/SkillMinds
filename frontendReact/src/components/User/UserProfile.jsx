
import "./UserProfile.css";

const UserProfile = () => {
  
  const user = {
    name: "John Doe",
    email: "johndoe@example.com",
    bio: "Passionate developer and lifelong learner. Always looking for new challenges and opportunities to grow.",
    avatar: "/images/avatar.png", 
    cover: "/images/cover.jpg", 
    joined: "January 2021",
    location: "Paris, France",
    skills: ["JavaScript", "React", "Node.js"],
    phone: "123-456-7890", 
    role: "Mentor", 
  };

  return (
    <div className="user-profile">
      <div
        className="profile-cover"
        style={{ backgroundImage: `url(${user.cover})` }}
      >
        <div className="cover-overlay"></div>
      </div>

      <div className="container profile-card">
        <div className="profile-header">
          <img src={user.avatar} alt="Profile" className="profile-avatar" />
          <div className="profile-info">
            <h1 className="profile-name">{user.name}</h1>
            <p className="profile-role">{user.role}</p>
            <p className="profile-email">{user.email}</p>
            <p className="profile-location">{user.location}</p>
            <p className="profile-phone">{user.phone}</p>
            <p className="profile-joined">Member since: {user.joined}</p>
          </div>
        </div>

        <div className="profile-bio">
          <h2>About Me</h2>
          <p>{user.bio}</p>
        </div>

        <div className="profile-skills">
          <h2>My Skills</h2>
          <ul>
            {user.skills.map((skill, index) => (
              <li key={index} className="skill-item">
                {skill}
              </li>
            ))}
          </ul>
        </div>

        <div className="profile-details">
          <h2>Additional Details</h2>
          <div className="details-grid">
            <div className="detail-item">
              <h3>Certifications</h3>
              <p>No certifications added yet.</p>
            </div>
            <div className="detail-item">
              <h3>Experience</h3>
              <p>5+ years in development</p>
            </div>
            <div className="detail-item">
              <h3>Projects</h3>
              <p>10 Completed Projects</p>
            </div>
          
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;