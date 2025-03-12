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
import Activities from "./components/activities/Activities.jsx";
import AddActivity from "./components/activities/AddActivity.jsx";
import UpdateActivity from "./components/activities/UpdateActivity.jsx";import GroupsList from "./components/Gestion_groupe/GroupsList.jsx";
import CreateGroup from "./components/Gestion_groupe/CreateGroup.jsx";
import CreateGroupPost from "./components/Gestion_groupe/CreateGroupPost.jsx";
import GroupPosts from "./components/Gestion_groupe/GroupPosts.jsx";
import GroupPostDetails from "./components/Gestion_groupe/GroupPostDetails.jsx";
import GroupRequests from "./components/Gestion_groupe/GroupRequests"; 
import EditGroup from "./components/Gestion_groupe/EditGroup.jsx";
import GroupMembers from "./components/Gestion_groupe/GroupMembers.jsx";
import AIRecommendation from "./components/Gestion_groupe/AIRecommendation.jsx";


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
        <Route path="/groups/:groupId/edit" element={<EditGroup />} />
        <Route path="/reset-password/:id/:token" element={<ForgetPassword />} />
        <Route path="/groups" element={<GroupsList />} />
        <Route path="/groups/:groupId" element={<GroupPosts />} />
        <Route path="/groups/:groupId/posts/:postId" element={<GroupPostDetails />} />
        <Route path="/groups/:groupId/requests" element={<GroupRequests />} /> 
        <Route path="/create-group" element={<CreateGroup />} />
        <Route path="/groups/:groupId/post" element={<CreateGroupPost />} />
        <Route path="/groups/:groupId/members" element={<GroupMembers />} />
        <Route path="/ai-recommendation" element={<AIRecommendation />} />
        
        <Route path="/activities" element={<Activities />} />
        <Route path="/add-activity" element={<AddActivity />} />
        <Route path="/update-activity/:id" element={<UpdateActivity />} />
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
