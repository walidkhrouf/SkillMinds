import { useState, useEffect, useRef } from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom";
import Head from "./Head";
import "./header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Load current user from localStorage and fetch notifications
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      const userObj = JSON.parse(userStr);
      setCurrentUser(userObj);
      fetchNotifications(userObj._id);
    } else {
      setCurrentUser(null);
    }
  }, [location]);

  // Poll notifications automatically every 5 seconds when a user exists
  useEffect(() => {
    if (!currentUser) return;
    const intervalId = setInterval(() => {
      fetchNotifications(currentUser._id);
    }, 3000);
    return () => clearInterval(intervalId);
  }, [currentUser]);

  const fetchNotifications = (userId) => {
    fetch(`http://localhost:5000/api/notifications?userId=${userId}`, { cache: "no-store" })
        .then((res) => res.json())
        .then((data) => setNotifications(data))
        .catch((err) => console.error("Error fetching notifications:", err));
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${notificationId}/markRead`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const updatedNotif = await res.json();
        setNotifications((prevNotifs) =>
            prevNotifs.map((notif) =>
                notif._id === updatedNotif._id ? updatedNotif : notif
            )
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllNotificationsAsRead = async () => {
    if (!currentUser) return;
    try {
      const unreadNotifications = notifications.filter((n) => !n.isRead);
      for (let notif of unreadNotifications) {
        await markNotificationAsRead(notif._id);
      }
      fetchNotifications(currentUser._id);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const toggleNotifications = () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState && currentUser) {
      markAllNotificationsAsRead();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  useEffect(() => {
    const storedDarkMode = sessionStorage.getItem("darkMode") === "true";
    setDarkMode(storedDarkMode);
    document.body.classList.toggle("dark-mode", storedDarkMode);
  }, []);

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newMode = !prev;
      document.body.classList.toggle("dark-mode", newMode);
      sessionStorage.setItem("darkMode", newMode);
      return newMode;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("jwtToken");
    setCurrentUser(null);
    setShowProfileDropdown(false);
    navigate("/");
  };

  const headerClass = `${location.pathname.startsWith("/admin") ? "admin-header" : ""}`;
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
      <>
        <Head />
        <header className={headerClass}>
          <nav className="header-nav">
            <Link to="/" className="logo">
              <img src="/images/logo.png" alt="Logo" />
            </Link>

            <ul className={menuOpen ? "nav-links active" : "nav-links"} onClick={closeMenu}>
              <li>
                <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink to="/courses" className={({ isActive }) => (isActive ? "active" : "")}>
                  Courses
                </NavLink>
              </li>
              <li>
                <NavLink to="/about" className={({ isActive }) => (isActive ? "active" : "")}>
                  About
                </NavLink>
              </li>
              <li>
                <NavLink to="/team" className={({ isActive }) => (isActive ? "active" : "")}>
                  Mentors
                </NavLink>
              </li>
              <li>
                <NavLink to="/pricing" className={({ isActive }) => (isActive ? "active" : "")}>
                  Pricing
                </NavLink>
              </li>
              <li>
                <NavLink to="/journal" className={({ isActive }) => (isActive ? "active" : "")}>
                  Groups
                </NavLink>
              </li>
              <li>
                <NavLink to="/contact" className={({ isActive }) => (isActive ? "active" : "")}>
                  Contact
                </NavLink>
              </li>
         
              <li>
                <a href="/activities" className={({ isActive }) => (isActive ? "active" : "")}>
                  Events
                </a>
              </li>

              <li>
                
                <NavLink to="/tutorials" className={({ isActive }) => (isActive ? "active" : "")}>
                  Tutorials
                </NavLink>
                
              </li>

              <li>
                <a href="/all-job-offers" className={({ isActive }) => (isActive ? "active" : "")}>
                  Recruitment
                </a>
              </li>
              <li>

                ||
              </li>
              {currentUser?.role === "admin" && (
                  <li>  
                    <NavLink to="/admin" className={({ isActive }) => (isActive ? "active" : "")}>
                      Admin
                    </NavLink>
                  </li>
              )}
              <li className="mobile-certificate">
                {currentUser ? (
                    <div
                        className="profile-container"
                        ref={profileRef}
                        onMouseEnter={() => setShowProfileDropdown(true)}
                        onMouseLeave={() => setShowProfileDropdown(false)}
                    >
                      <button onClick={() => navigate("/profile")} className="certificate-btn">
                        View Profile
                      </button>
                      {showProfileDropdown && (
                          <div className="profile-dropdown">
                            <div className="profile-photo-container">
                              <img
                                  src={
                                    currentUser.profileImage && currentUser.profileImage.fileId
                                        ? `http://localhost:5000/api/files/${currentUser.profileImage.fileId}`
                                        : "/images/avatar.png"
                                  }
                                  alt="Profile"
                                  className="profile-photo"
                              />
                            </div>
                            <div className="profile-details">
                              <div className="profile-item">
                                <span className="label">Username:</span>
                                <span className="value">{currentUser.username || "User"}</span>
                              </div>
                              <div className="profile-item">
                                <span className="label">Email:</span>
                                <span className="value">{currentUser.email || "N/A"}</span>
                              </div>
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>
                              Logout
                            </button>
                          </div>
                      )}
                    </div>
                ) : (
                    <NavLink to="/signin" className="certificate-btn">
                      Signin or Signup
                    </NavLink>
                )}
              </li>
            </ul>

            <div className="header-actions">
              <div className="start">
                {currentUser ? (
                    <div
                        className="profile-container"
                        ref={profileRef}
                        onMouseEnter={() => setShowProfileDropdown(true)}
                        onMouseLeave={() => setShowProfileDropdown(false)}
                    >
                      <button onClick={() => navigate("/profile")} className="certificate-btn">
                        View Profile
                      </button>
                      {showProfileDropdown && (
                          <div className="profile-dropdown">
                            <div className="profile-photo-container">
                              <img
                                  src={
                                    currentUser.profileImage && currentUser.profileImage.fileId
                                        ? `http://localhost:5000/api/files/${currentUser.profileImage.fileId}`
                                        : "/images/avatar.png"
                                  }
                                  alt="Profile"
                                  className="profile-photo"
                              />
                            </div>
                            <div className="profile-details">
                              <div className="profile-item">
                                <span className="label">Username:</span>
                                <span className="value">{currentUser.username || "User"}</span>
                              </div>
                              <div className="profile-item">
                                <span className="label">Email:</span>
                                <span className="value">{currentUser.email || "N/A"}</span>
                              </div>
                            </div>
                            <button className="logout-btn" onClick={handleLogout}>
                              Logout
                            </button>
                          </div>
                      )}
                    </div>
                ) : (
                    <NavLink to="/signin" className="certificate-btn">
                      Signin or Signup
                    </NavLink>
                )}
              </div>
              {currentUser && (
                  <div className="notification-container" ref={notifRef}>
                    <div className="notification-icon" onClick={toggleNotifications}>
                      <i className="fas fa-bell"></i>
                      {unreadCount > 0 && (
                          <span className="notification-badge">{unreadCount}</span>
                      )}
                    </div>
                    {showNotifications && (
                        <div className="notification-dropdown">
                          {notifications.length > 0 ? (
                              notifications.map((notif) => (
                                  <div
                                      key={notif._id}
                                      className={`notification-item ${notif.isRead ? "read" : "unread"}`}
                                      onClick={() => markNotificationAsRead(notif._id)}
                                  >
                                    <p>{notif.message}</p>
                                    <span className="notification-time">
                            {new Date(notif.createdAt).toLocaleTimeString()}
                          </span>
                                  </div>
                              ))
                          ) : (
                              <p className="no-notifications">No notifications</p>
                          )}
                        </div>
                    )}
                  </div>
              )}
              <button className="darkmode-toggle" onClick={toggleDarkMode}>
                {darkMode ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
              </button>
            </div>

            <button className="toggle" onClick={handleToggle}>
              {menuOpen ? <i className="fas fa-times"></i> : <i className="fas fa-bars"></i>}
            </button>
          </nav>
        </header>
      </>
  );
};

export default Header;
