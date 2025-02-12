import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import Head from "./Head";
import "./header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleToggle = () => setMenuOpen(prev => !prev);
  const closeMenu = () => setMenuOpen(false);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      if (newMode) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
      return newMode;
    });
  };

  return (
    <>
      <Head />
      <header>
        <nav className="header-nav">
          {/* Navigation Links */}
          <ul
            className={menuOpen ? "nav-links active" : "nav-links"}
            onClick={closeMenu}
          >
            <li>
              <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/courses" className={({ isActive }) => (isActive ? "active" : "")}>
                All Courses
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
                About
              </NavLink>
            </li>
            <li>
              <NavLink to="/team" className={({ isActive }) => (isActive ? "active" : "")}>
                Team
              </NavLink>
            </li>
            <li>
              <NavLink to="/pricing" className={({ isActive }) => (isActive ? "active" : "")}>
                Pricing
              </NavLink>
            </li>
            <li>
              <NavLink to="/journal" className={({ isActive }) => (isActive ? "active" : "")}>
                Journal
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>
                Contact
              </NavLink>
            </li>
            {/* Mobile-only certificate button */}
            <li className="mobile-certificate">
              <button className="certificate-btn">Signin/Signup</button>
            </li>
          </ul>

          {/* Right-hand actions */}
          <div className="header-actions">
            <div className="start">
              <button className="certificate-btn">Signin/Signup</button>
            </div>
            <button className="darkmode-toggle" onClick={toggleDarkMode}>
              {darkMode ? <i className="fa fa-sun"></i> : <i className="fa fa-moon"></i>}
            </button>
          </div>

          {/* Hamburger Toggle for Mobile */}
          <button className="toggle" onClick={handleToggle}>
            {menuOpen ? <i className="fa fa-times"></i> : <i className="fa fa-bars"></i>}
          </button>
        </nav>
      </header>
    </>
  );
};

export default Header;
