import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; 
import axios from "axios";
import { NavLink } from "react-router-dom";
import "./ForgetPassword.css"; 

const ForgetPassword = () => {
  const navigate = useNavigate();
  const { id, token } = useParams(); 
  const [formData, setFormData] = useState({
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); 

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);
  
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
    // Validate password
    if (!passwordRegex.test(formData.password)) {
      setError("Password must be at least 8 characters long, contain an uppercase letter, a number, and a special character.");
      setLoading(false);
      return;
    }
  
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }
  
    // Send the request to reset the password
    axios
      .post(`http://localhost:5000/api/users/reset-password/${id}/${token}`, {
        password: formData.password,
      })
      .then((res) => {
        if (res.data.message === "Password reset successfully!") {
          setSuccess("Your password has been reset successfully!");
  
          // Redirect to the login page after 2 seconds
          setTimeout(() => {
            navigate("/signin");
          }, 2000);
        } else {
          setError(res.data.message);
        }
      })
      .catch((err) => {
        console.error("Reset password error:", err);
  
        // Handle token expiration
        if (err.response?.data?.expired) {
          setError("The password reset link has expired. Please request a new one.");
          navigate("/forgot-password"); // Redirect to the forgot password page
        } else if (err.response) {
          setError(err.response.data.message || "Failed to reset password. Please try again later.");
        } else if (err.request) {
          setError("No response from server. Please check your network connection.");
        } else {
          setError("An error occurred: " + err.message);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <div className="auth-container">
      <h2>Reset Password</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form className="auth-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="password">New Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            placeholder="Enter your new password"
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm New Password:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            placeholder="Confirm your new password"
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      <div className="switch-auth">
        <p>Remembered your password? <NavLink to="/signin">Sign In</NavLink></p>
      </div>
    </div>
  );
};

export default ForgetPassword;