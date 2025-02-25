import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import axios from "axios";
import "./Signin.css";

const Signin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
    setMessage("");
  };

  const handleOtpChange = (e) => {
    setOtp(e.target.value);
    setError("");
  };

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

      if (response.data.userId && !response.data.token) {
        setMessage(response.data.message || "OTP sent to your email.");
        setUserId(response.data.userId);
        setOtpSent(true);
      } else if (response.data.user && response.data.token) {
        localStorage.setItem("currentUser", JSON.stringify(response.data.user));
        localStorage.setItem("jwtToken", response.data.token);
        if (response.data.user.role === "admin") {
          navigate("/admin");
        } else {
          const user = response.data.user;
          const hasChosenSkills = user.hasChosenSkills;
          if (hasChosenSkills === "false") {
            navigate("/firstchoose");
          } else {
            navigate("/");
          }
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

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError("Please enter the OTP.");
      return;
    }
    setLoading(true);
    try {
      const response = await axios.post("http://localhost:5000/api/users/verifyOTP", {
        email: formData.email,
        otp,
      });
      if (response.data.user && response.data.token) {
        localStorage.setItem("currentUser", JSON.stringify(response.data.user));
        localStorage.setItem("jwtToken", response.data.token);
        if (response.data.user.role === "admin") {
          navigate("/admin");
        } else {
          const user = response.data.user;
          const hasChosenSkills = user.hasChosenSkills;
          if (hasChosenSkills === false) {
            navigate("/firstchoose");
          } else {
            navigate("/");
          }
        }
      } else {
        setError("OTP verification failed.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred during OTP verification.");
    } finally {
      setLoading(false);
    }
  };

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
    <div className="signup-container">
      <div className="left-box">
        <div className="auth-container">
          <h2>Sign In</h2>
          {error && <p className="error">{error}</p>}
          {message && <p className="success-message">{message}</p>}
          {!otpSent ? (
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
          ) : (
            <form className="auth-form" onSubmit={handleOtpSubmit}>
              <div className="form-group">
                <label htmlFor="otp">Enter OTP:</label>
                <input
                  type="text"
                  id="otp"
                  name="otp"
                  placeholder="Enter the OTP sent to your email"
                  value={otp}
                  onChange={handleOtpChange}
                  required
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="auth-btn" disabled={loading}>
                  {loading ? "Verifying..." : "Verify OTP"}
                </button>
              </div>
            </form>
          )}
          <div className="switch-auth">
            <p>
              Don’t have an account? <NavLink to="/signup">Sign Up</NavLink>
            </p>
          </div>
        </div>
      </div>
      <div className="right-box">
        <div className="content">
          <h1>Welcome to SkillMinds</h1>
        </div>
      </div>
    </div>
  );
};

export default Signin;