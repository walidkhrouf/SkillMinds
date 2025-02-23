import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { getNames } from 'country-list';
import axios from "axios";
import PhoneInput from 'react-phone-number-input'; // For phone number input
import 'react-phone-number-input/style.css'; // Default styles
import { parsePhoneNumberFromString } from 'libphonenumber-js'; // For phone number validation
import "./Signup.css";

const SignupForm = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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

  // Filtered countries list (excluding Israel)
  const countries = Object.entries(getNames()).filter(([code, name]) => name !== "Israel");

  // Validate phone number using libphonenumber-js
  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;

    // Parse the phone number
    const phoneNumberInfo = parsePhoneNumberFromString(phoneNumber);

    // Check if the number is valid
    if (phoneNumberInfo && phoneNumberInfo.isValid()) {
      return true;
    }

    return false;
  };

  // Handle changes in form fields
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle file changes (profile image and certificates)
  const handleFileChange = (e) => {
    if (e.target.name === "profileImage") {
      setProfileImage(e.target.files[0]);
    } else if (e.target.name === "certificateImage") {
      setCertificateImage(Array.from(e.target.files));
    }
  };

  // Validate the current step
  const validateStep = () => {
    if (step === 1) {
      if (!formData.username || !formData.email || !formData.phoneNumber) {
        setError("Please fill all required fields");
        return false;
      }

      // Validate phone number
      if (!validatePhoneNumber(formData.phoneNumber)) {
        setError("Invalid phone number");
        return false;
      }
    }

    if (step === 2) {
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(formData.password)) {
        setError("Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.");
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        return false;
      }
    }

    if (step === 3) {
      if (!formData.location || !formData.role) {
        setError("Please fill all required fields");
        return false;
      }
      if (formData.role === "mentor" && (!certificateImage || certificateImage.length === 0)) {
        setError("Certificate image is required for mentors");
        return false;
      }
    }

    setError("");
    return true;
  };

  // Move to the next step
  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  // Go back to the previous step
  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) formDataToSend.append(key, formData[key]);
    });
    if (profileImage) formDataToSend.append("profileImage", profileImage);
    if (formData.role === "mentor" && certificateImage) {
      certificateImage.forEach(file => formDataToSend.append("certificateImage", file));
    }

    try {
      const response = await axios.post("http://localhost:5000/api/users/signup", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setSuccess(response.data.message);
      setError("");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred";
      setError(errorMessage);
      setSuccess("");

      // Reset to step 1 if the user already exists
      if (errorMessage.toLowerCase().includes("already exists")) {
        setStep(1);
      }
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <div className="progress-indicator">
        <div className={`progress-step ${step >= 1 ? "active" : ""}`}></div>
        <div className={`progress-step ${step >= 2 ? "active" : ""}`}></div>
        <div className={`progress-step ${step >= 3 ? "active" : ""}`}></div>
      </div>

      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Step 1: Personal Information */}
        <div className={`form-step ${step === 1 ? "active" : ""}`}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Enter your username"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number:</label>
            <PhoneInput
              international
              defaultCountry="TN" // Default country (e.g., Tunisia)
              value={formData.phoneNumber}
              onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
              placeholder="Enter your phone number"
            />
          </div>
        </div>

        {/* Step 2: Account Security */}
        <div className={`form-step ${step === 2 ? "active" : ""}`}>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password:</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Step 3: Additional Information */}
        <div className={`form-step ${step === 3 ? "active" : ""}`}>
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
            <textarea
              id="bio"
              name="bio"
              placeholder="Tell us about yourself"
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <select
              id="location"
              name="location"
              onChange={handleChange}
              value={formData.location}
            >
              <option value="">Select your country</option>
              {countries.map(([code, name]) => (
                <option key={code} value={name}>{name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
  <label htmlFor="profileImage">Profile Image:</label>
  <div>
    <input
      type="file"
      id="profileImage"
      name="profileImage"
      accept="image/*"
      onChange={handleFileChange}
    />
    <label htmlFor="profileImage" className="custom-file-label">
      Choose File
    </label>
    <span className="file-name">
      {profileImage ? profileImage.name : "No file chosen"}
    </span>
  </div>
</div>

{formData.role === "mentor" && (
  <div className="form-group">
    <label htmlFor="certificateImage">Certificates:</label>
    <div>
      <input
        type="file"
        id="certificateImage"
        name="certificateImage"
        accept="image/*"
        multiple
        onChange={handleFileChange}
      />
      <label htmlFor="certificateImage" className="custom-file-label">
        Choose Files
      </label>
      <span className="file-name">
        {certificateImage ? `${certificateImage.length} files chosen` : "No files chosen"}
      </span>
    </div>
  </div>
)}
        </div>

        {/* Step Navigation */}
        <div className="form-navigation">
          {step > 1 && (
            <button type="button" className="auth-btn secondary" onClick={handleBack}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button type="button" className="auth-btn" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="submit" className="auth-btn">
              Submit
            </button>
          )}
        </div>
      </form>

      <div className="switch-auth">
        <p>Already have an account? <NavLink to="/signin">Sign In</NavLink></p>
      </div>
    </div>
  );
};

export default SignupForm;