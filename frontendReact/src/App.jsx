import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/common/header/Header";
import Home from "./components/home/Home";
import About from "./components/about/About";
import CourseHome from "./components/allcourses/CourseHome";
import Team from "./components/team/Team";
import Pricing from "./components/pricing/Pricing";
import Blog from "./components/blog/Blog";
import Contact from "./components/contact/Contact";
import Footer from "./components/common/footer/Footer";
import "./App.css";
import Signin from "./components/User/Signin";
import Signup from "./components/User/Signup";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard.jsx";
import UserProfile from "./components/User/UserProfile.jsx";
import SkillsList from "./SkillsList/SkillList.jsx";
import ForgetPassword from "./components/User/ForgetPassword.jsx";

const AppContent = () => {
  const { pathname } = useLocation();
  const hideLayout = pathname === "/admin";
  
  return (
    <>
      {!hideLayout && <Header />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/courses" element={<CourseHome />} />
        <Route path="/team" element={<Team />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/journal" element={<Blog />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/reset-password/:id/:token" element={<ForgetPassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/firstchoose" element={<SkillsList />} />
      </Routes>
      {!hideLayout && <Footer />}
    </>
  );
};

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;