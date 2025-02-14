import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import Head from "./Head";
import "./header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const location = useLocation();

  // Determine if we're on an auth page (signin or signup)
  const isAuthPage =
    location.pathname === "/signin" || location.pathname === "/signup";

  // Determine if we're on an admin page (adjust based on your routing)
  const isAdminPage = location.pathname.startsWith("/admin");

  const handleToggle = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      if (newMode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
      return newMode;
    });
  };

  // Add admin-header class if on an admin page so header becomes transparent
  const headerClass = `${isAuthPage ? "auth-header" : ""} ${
    isAdminPage ? "admin-header" : ""
  }`;

  return (
    <>
      <Head />
      <header className={headerClass}>
        <nav className="header-nav">
          {/* Navigation Links */}
          <ul
            className={menuOpen ? "nav-links active" : "nav-links"}
            onClick={closeMenu}
          >
            <li>
              <NavLink
                to="/"
                end
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Home
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/courses"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                All Courses
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/about"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                About
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/team"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Team
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pricing"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Pricing
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/journal"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Journal
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/contact"
                className={({ isActive }) => (isActive ? "active" : "")}
              >
                Contact
              </NavLink>
            </li>
            <li className="mobile-certificate">
              <NavLink to="/signin" className="certificate-btn">
                Signin/Signup
              </NavLink>
            </li>
          </ul>

          {/* Right-hand actions */}
          <div className="header-actions">
            <div className="start">
              <NavLink to="/signin" className="certificate-btn">
                Signin/Signup
              </NavLink>
            </div>
            <button className="darkmode-toggle" onClick={toggleDarkMode}>
              {darkMode ? (
                <i className="fas fa-sun"></i>
              ) : (
                <i className="fas fa-moon"></i>
              )}
            </button>
          </div>

          {/* Hamburger Toggle for Mobile */}
          <button className="toggle" onClick={handleToggle}>
            {menuOpen ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
          </button>
        </nav>
      </header>
    </>
  );
};

export default Header;