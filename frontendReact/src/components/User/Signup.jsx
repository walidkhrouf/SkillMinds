import React, { useState, useEffect } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { getNames } from "country-list";
import axios from "axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { parsePhoneNumberFromString } from "libphonenumber-js";
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
    cityCode: "", // Ajout du code de la ville

  });
  const [profileImage, setProfileImage] = useState(null);
  const [mentorSkills, setMentorSkills] = useState([]);
  const [mentorCertificates, setMentorCertificates] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const countries = Object.entries(getNames()).filter(([, name]) => name !== "Israel");
  const [availableSkills, setAvailableSkills] = useState([]);
  const [cities, setCities] = useState([]); // Liste des villes

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch("http://localhost:5000/api/users/skills");
        if (res.ok) {
          const data = await res.json();
          setAvailableSkills(data);
        } else {
          setError("Error fetching skills.");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching skills.");
      }
    }
    fetchSkills();
  }, []);

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber) return false;
    const phoneInfo = parsePhoneNumberFromString(phoneNumber);
    return phoneInfo && phoneInfo.isValid();
  };



  const handleFileChange = (e) => {
    if (e.target.name === "profileImage") {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.startsWith("image/")) {
          setError("Profile image must be a valid image file (e.g., JPG, PNG).");
          setProfileImage(null);
        } else {
          setError("");
          setProfileImage(file);
        }
      }
    }
  };
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === "location") {
      setFormData({
        ...formData,
        location: e.target.value,
        cityCode: "", // Réinitialiser le code de la ville
      });
      setCities([]); // Réinitialiser la liste des villes
    }
  };
  

  const handleCityChange = (e) => {
    const selectedCity = e.target.value;
    setFormData({ ...formData, cityCode: selectedCity }); // Stocker le code de la ville dans `cityCode`
  };
  // Charger les villes en fonction du pays sélectionné
  useEffect(() => {
    const fetchCities = async () => {
      if (formData.location) {
        try {
          const response = await axios.post("https://countriesnow.space/api/v0.1/countries/cities", {
            country: formData.location,
          });
          setCities(response.data.data || []);
        } catch (error) {
          console.error("Error fetching cities:", error);
          setCities([]);
        }
      }
    };

    fetchCities();
  }, [formData.location]);

  const handleMentorCertificateChange = (e, skillId) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith("image/")) {
        setError("Certificate must be a valid image file (e.g., JPG, PNG).");
        setMentorCertificates((prev) => ({ ...prev, [skillId]: null }));
      } else {
        setError("");
        setMentorCertificates((prev) => ({ ...prev, [skillId]: file }));
      }
    }
  };

  const toggleMentorSkill = (skillId) => {
    if (mentorSkills.includes(skillId)) {
      setMentorSkills(mentorSkills.filter((id) => id !== skillId));
      setMentorCertificates((prev) => {
        const newCerts = { ...prev };
        delete newCerts[skillId];
        return newCerts;
      });
    } else {
      setMentorSkills([...mentorSkills, skillId]);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.username.trim() || !formData.email.trim() || !formData.phoneNumber) {
        setError("Please fill all required fields in step 1.");
        return false;
      }
      if (!validatePhoneNumber(formData.phoneNumber)) {
        setError("Invalid phone number.");
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
        setError("Passwords do not match.");
        return false;
      }
    }
    if (step === 3) {
      if (!formData.location || !formData.role) {
        setError("Please fill all required fields in step 3.");
        return false;
      }
      if (formData.role === "mentor") {
        if (mentorSkills.length === 0) {
          setError("Please select at least one mentor skill.");
          return false;
        }
        for (let skillId of mentorSkills) {
          if (!mentorCertificates[skillId]) {
            setError("Please upload a certificate for each selected mentor skill.");
            return false;
          }
        }
      }
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    const formDataToSend = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key]) formDataToSend.append(key, formData[key]);
    });
    if (profileImage) formDataToSend.append("profileImage", profileImage);
    if (formData.role === "mentor" && mentorSkills.length > 0) {
      mentorSkills.forEach((skillId) => {
        const file = mentorCertificates[skillId];
        if (file) {
          formDataToSend.append(`mentorCertificate_${skillId}`, file);
        }
      });
      formDataToSend.append("mentorSkills", JSON.stringify(mentorSkills));
    }

    try {
      const response = await axios.post("http://localhost:5000/api/users/signup", formDataToSend, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(response.data.message);
      setError("");
      setTimeout(() => navigate("/signin"), 2000);
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred during signup.";
      setError(errorMessage);
      setSuccess("");
      if (errorMessage.toLowerCase().includes("already exists")) {
        setStep(1);
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="left-box">
       
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
            <div className={`form-step ${step === 1 ? "active" : ""}`}>
              <div className="form-group">
                <label htmlFor="username">Username:</label>
                <input type="text" id="username" name="username" placeholder="Enter your username" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input type="email" id="email" name="email" placeholder="Enter your email" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="phoneNumber"> 
                  Phone Number:</label>
                <PhoneInput
                  international
                  defaultCountry="TN"
                  value={formData.phoneNumber}
                  onChange={(value) => setFormData({ ...formData, phoneNumber: value })}
                  placeholder="Enter your phone number"
                />
              </div>
            </div>

            <div className={`form-step ${step === 2 ? "active" : ""}`}>
              <div className="form-group">
                <label htmlFor="password">Password:</label>
                <input type="password" id="password" name="password" placeholder="Enter your password" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password:</label>
                <input type="password" id="confirmPassword" name="confirmPassword" placeholder="Confirm your password" onChange={handleChange} />
              </div>
            </div>

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
                <textarea id="bio" name="bio" placeholder="Tell us about yourself" onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location:</label>
                <select id="location" name="location" onChange={handleChange} value={formData.location}>
                  <option value="">Select your country</option>
                  {countries.map(([code, name]) => (
                    <option key={code} value={name}>{name}</option>
                  ))}
                </select>
                
              <div className="form-group">
            <label htmlFor="city">City:</label>
               <select id="city" name="cityCode" onChange={handleCityChange} required disabled={!formData.location}>
                <option value="">Select your city</option>
            {cities.map((city, index) => (
              <option key={index} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
              </div>
              <div className="form-group">
                <label htmlFor="profileImage">Profile Image:</label>
                <div className="file-upload-container">
                  <input type="file" id="profileImage" name="profileImage" accept="image/*" onChange={handleFileChange} />
                  <label htmlFor="profileImage" className="custom-file-label">Choose File</label>
                  <span className="file-name">{profileImage ? profileImage.name : "No file chosen"}</span>
                  <span className="image-indicator">[Images only]</span>
                </div>
              </div>
              {formData.role === "mentor" && (
                <div className="mentor-skills-section">
                  <h3>Select Your Mentor Skills:</h3>
                  <div className="mentor-skills-pill-list">
                    {availableSkills.map((skill) => (
                      <span
                        key={skill._id}
                        className={`mentor-skill-pill ${mentorSkills.includes(skill._id) ? "selected" : ""}`}
                        onClick={() => toggleMentorSkill(skill._id)}
                      >
                        {skill.name}
                      </span>
                    ))}
                  </div>
                  {mentorSkills.map((skillId) => {
                    const skillObj = availableSkills.find((s) => s._id === skillId);
                    return (
                      <div key={skillId} className="mentor-certificate-input">
                        <label>
                          Upload certificate for {skillObj ? skillObj.name : skillId} (images only):
                        </label>
                        <input type="file" accept="image/*" onChange={(e) => handleMentorCertificateChange(e, skillId)} />
                        <span className="file-name">
                          {mentorCertificates[skillId] ? mentorCertificates[skillId].name : "No file chosen"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
            <p>
              Already have an account? <NavLink to="/signin">Sign In</NavLink>
            </p>
          </div>
        </div>
      </div>

      <div className="right-box">
        <div className="content">
          <h1> Welcome to SkillMinds</h1>
        </div>
      </div>
    </div>
  );
};

export default SignupForm;