import { NavLink } from "react-router-dom";
import "./Signup.css";

const Signup = () => {
  return (
    <div className="auth-container">
      <h2>Sign Up</h2>
      <form className="auth-form">
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input 
            type="text" 
            id="username" 
            name="username" 
            placeholder="Enter your username" 
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
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input 
            type="password" 
            id="confirmPassword" 
            name="confirmPassword" 
            placeholder="Confirm your password" 
            required 
          />
        </div>
        <div className="form-actions">
          <button type="submit" className="auth-btn">Sign Up</button>
        </div>
      </form>
      <div className="switch-auth">
        <p>
          Already have an account?{" "}
          <NavLink to="/signin">Sign In</NavLink>
        </p>
      </div>
    </div>
  );
};

export default Signup;
