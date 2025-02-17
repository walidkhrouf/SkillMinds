import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "axios";
import "./Signin.css";

const Signin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    // Basic email validation regex
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
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
        // Store current user data in localStorage
        localStorage.setItem("currentUser", JSON.stringify(response.data.user));
        setError("");
        navigate("/");
      } else {
        setError("Sign in failed. Please check your credentials.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Sign In</h2>
      {error && <p className="error">{error}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
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
        <div className="form-actions">
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </div>
        <div className="forgot-password">
          <NavLink to="/reset-password">Forgot Password?</NavLink>
        </div>
        <div className="social-login">
          <p>Or connect with:</p>
          <button type="button" className="social-btn facebook">Facebook</button>
          <button type="button" className="social-btn google">Google</button>
        </div>
      </form>
      <div className="switch-auth">
        <p>
          Dont have an account? <NavLink to="/signup">Sign Up</NavLink>
        </p>
      </div>
    </div>
  );
};

export default Signin;