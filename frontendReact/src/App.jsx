import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import PropTypes from "prop-types";
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
import AllJobOffers from "./components/GestionRecruitement/AllJobOffers.jsx";
import CreateJobOffer from "./components/GestionRecruitement/CreateJobOffer.jsx";
import ApplyToJob from "./components/GestionRecruitement/ApplyToJob.jsx";
import AllJobApplications from "./components/GestionRecruitement/AllJobApplication.jsx";
import EditJobOffer from "./components/GestionRecruitement/EditJobOffer.jsx";
import JobOfferDetails from "./components/GestionRecruitement/JobOfferDetails.jsx";

const AdminRoute = ({ children }) => {
  const storedUser = localStorage.getItem("currentUser");
  if (!storedUser) {
    return <Navigate to="/signin" replace />;
  }
  const user = JSON.parse(storedUser);
  if (user.role !== "admin") {
    return <Navigate to="/" replace />;
  }
  return children;
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

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
        <Route path="/profile" element={<UserProfile />} />
        <Route path="/firstchoose" element={<SkillsList />} />
        
        <Route path="/all-job-offers" element={<AllJobOffers />} />
        <Route path="/create-job-offer" element={<CreateJobOffer />} />
        <Route path="/apply-to-job/:jobId" element={<ApplyToJob />} />
        <Route path="/all-job-applications" element={<AllJobApplications />} />
        <Route path="/edit-job-offer/:jobId" element={<EditJobOffer />} />
        <Route path="/job-details/:jobId" element={<JobOfferDetails />} />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />
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