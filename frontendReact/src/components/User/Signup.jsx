import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "axios";
import "./Signup.css";

const SignupForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    role: "learner",
    bio: "",
    location: "",
  });
  const [profileImage, setProfileImage] = useState(null);
  const [certificateImage, setCertificateImage] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.name === "profileImage") {
      setProfileImage(e.target.files[0]);
    } else if (e.target.name === "certificateImage") {
      setCertificateImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }


    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) {
        formDataToSend.append(key, formData[key]);
      }
    });
    if (profileImage) {
      formDataToSend.append("profileImage", profileImage);
    }
    if (formData.role === "mentor" && certificateImage) {
      formDataToSend.append("certificateImage", certificateImage);
    }

    try {
      const response = await axios.post("http://localhost:5000/api/users/signup", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    
      setSuccess(response.data.message);
      setError("");
      setTimeout(() => {
        navigate("/signin");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
      setSuccess("");
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input type="text" id="username" name="username" placeholder="Enter your username" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" name="email" placeholder="Enter your email" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input type="text" id="phoneNumber" name="phoneNumber" placeholder="Enter your phone number"  pattern="\d{8,}"   title="Phone number must be at least 8 digits" 
 onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input type="password" id="password" name="password" placeholder="Enter your password" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label htmlFor="role">Role:</label>
          <select id="role" name="role" onChange={handleChange}>
            <option value="learner">Learner</option>
            <option value="mentor">Mentor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="bio">Bio:</label>
          <textarea id="bio" name="bio" placeholder="Enter your bio" onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location:</label>
          <input type="text" id="location" name="location" placeholder="Enter your location" onChange={handleChange} />
        </div>
        <div className="form-group">
          <label htmlFor="profileImage">Profile Image:</label>
          <input type="file" id="profileImage" name="profileImage" accept="image/*" onChange={handleFileChange} />
        </div>
        {formData.role === "mentor" && (
          <div className="form-group">
            <label htmlFor="certificateImage">Certificate Image:</label>
            <input type="file" id="certificateImage" name="certificateImage" accept="image/*" onChange={handleFileChange} />
          </div>
        )}
        <button type="submit" className="auth-btn">Sign Up</button>
      </form>
      <div className="switch-auth">
        <p>Already have an account? <NavLink to="/signin">Sign In</NavLink></p>
      </div>
    </div>
  );
};

export default SignupForm;
