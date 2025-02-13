// src/components/Signin.jsx
import { NavLink } from "react-router-dom";
import "./Signin.css";

const Signin = () => {
  return (
    <div className="auth-container">
      <h2>Sign In</h2>
      <form className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            placeholder="Enter your email" 
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
            required 
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="auth-btn">Sign In</button>
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
          Dont have an account?{" "}
          <NavLink to="/signup">Sign Up</NavLink>
        </p>
      </div>
    </div>
  );
};

export default Signin;
