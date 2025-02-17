import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom"; // useParams for dynamic token
import axios from "axios";
import { NavLink } from "react-router-dom";
import "./ForgetPassword.css"; 

const ForgetPassword = () => {
  const navigate = useNavigate();
  const { id, token } = useParams(); // Extract id and token from URL parameters
  const [formData, setFormData] = useState({
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false); // Loading state

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true); // Start loading
  
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
  
    // Ensure that password is being sent correctly
    axios.post(`http://localhost:5000/api/users/reset-password/${id}/${token}`, {
      password: formData.password,
    })
    .then(res => {
      if (res.data.message === "Password reset successfully!") {
        setSuccess("Your password has been reset successfully!");
  
        // Redirect to sign-in page after a short delay
        setTimeout(() => {
          navigate("/signin");
        }, 2000);
      } else {
        // Handle cases where the reset operation failed
        setError(res.data.message);
      }
    })
    .catch(err => {
        console.error('Reset password error:', err);
      
        // Check if the error has a response
        if (err.response) {
          // Server responded with a status other than 200-299
          setError(err.response.data.message || "Failed to reset password. Please try again later.");
        } else if (err.request) {
          // Request was made but no response received
          setError("No response from server. Please check your network connection.");
        } else {
          // Something happened in setting up the request
          setError("An error occurred: " + err.message);
        }
      })
    .finally(() => {
      setLoading(false); // Stop loading
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