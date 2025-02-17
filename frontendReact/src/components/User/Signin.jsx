import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "axios";
import "./Signin.css";

const Signin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Simple email validation
  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError("Both email and password are required.");
      return;
    }
    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/users/signin", formData);
      if (response.data.user) {
        // Save current user in localStorage
        localStorage.setItem("currentUser", JSON.stringify(response.data.user));
        // If the user hasn't chosen skills yet, redirect to /firstchoose
        if (!localStorage.getItem("hasChosenSkills")) {
          navigate("/firstchoose");
        } else {
          navigate("/");
        }
      } else {
        setError("Sign in failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  // Handle forgot password (if you have an endpoint for it)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/users/forgot-password", { email: formData.email });
      if (res.data.message) {
        setMessage(res.data.message);
        setError("");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during forgot password.");
      setMessage("");
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign In</h2>
      {error && <p className="error">{error}</p>}
      {message && <p className="success-message">{message}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            placeholder="Enter your email" 
            value={formData.email}
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            placeholder="Enter your password" 
            value={formData.password}
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>
        <div className="forgot-password">
          <NavLink to="#" onClick={handleForgotPassword}>Forgot Password?</NavLink>
        </div>
        <div className="social-login">
          <p>Or connect with:</p>
          <button type="button" className="social-btn facebook">Facebook</button>
          <button type="button" className="social-btn google">Google</button>
        </div>
      </form>
      <div className="switch-auth">
        <p>
          Don t have an account? <NavLink to="/signup">Sign Up</NavLink>
        </p>
      </div>
    </div>
  );
};

export default Signin;