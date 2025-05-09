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
import Signin from "./components/User/Signin";
import Signup from "./components/User/Signup";
import AdminDashboard from "./components/AdminDashboard/AdminDashboard.jsx";
import UserProfile from "./components/User/UserProfile.jsx";
import SkillsList from "./SkillsList/SkillList.jsx";
import ForgetPassword from "./components/User/ForgetPassword.jsx";
import Activities from "./components/activities/Activities.jsx";
import AddActivity from "./components/activities/AddActivity.jsx";
import UpdateActivity from "./components/activities/UpdateActivity.jsx";
import GroupsList from "./components/Gestion_groupe/GroupsList.jsx";
import CreateGroup from "./components/Gestion_groupe/CreateGroup.jsx";
import CreateGroupPost from "./components/Gestion_groupe/CreateGroupPost.jsx";
import GroupPosts from "./components/Gestion_groupe/GroupPosts.jsx";
import GroupPostDetails from "./components/Gestion_groupe/GroupPostDetails.jsx";
import GroupRequests from "./components/Gestion_groupe/GroupRequests";
import EditGroup from "./components/Gestion_groupe/EditGroup.jsx";
import GroupMembers from "./components/Gestion_groupe/GroupMembers.jsx";
import AIRecommendation from "./components/Gestion_groupe/AIRecommendation.jsx";
import CoursesCard from "./components/allcourses/CoursesCard.jsx";
import CreateCourse from "./components/Courses/CreateCourse.jsx";
import CourseDetails from "./components/Courses/CourseDetails.jsx";
import AllCourses from "./components/Courses/AllCourses.jsx";
import UpdateCourse from "./components/Courses/UpdateCourse.jsx";
import Recruitement from "./components/GestionRecruitement/Recruitement.jsx";
import AllJobApplications from "./components/GestionRecruitement/AllJobApplication.jsx";
import AllJobOffers from "./components/GestionRecruitement/AllJobOffers.jsx";
import CreateJobOffer from "./components/GestionRecruitement/CreateJobOffer.jsx";
import ApplyToJob from "./components/GestionRecruitement/ApplyToJob.jsx";
import EditJobOffer from "./components/GestionRecruitement/EditJobOffer.jsx";
import JobOfferDetails from "./components/GestionRecruitement/JobOfferDetails.jsx";
import RecommendedJobs from "./components/GestionRecruitement/RecommendedJobs.jsx";
import Tutorials from "./components/Gestion_tutorial/Tutorials.jsx";
import CreateTutorial from "./components/Gestion_tutorial/CreateTutorial.jsx";
import TutorialDetail from "./components/Gestion_tutorial/TutorialDetail.jsx";
import PickInterviewDate from "./components/GestionRecruitement/PickInterviewDate.jsx";
import ChatBot from "./components/chatbot/ChatBot.jsx";
import ActivityDetails from "./components/activities/ActivityDetails.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminRoute = ({ children }) => {
  const storedUser = localStorage.getItem("currentUser");
  if (!storedUser) return <Navigate to="/signin" replace />;
  const user = JSON.parse(storedUser);
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
};
AdminRoute.propTypes = { children: PropTypes.node.isRequired };

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

          {/* Group management */}
          <Route path="/groups" element={<GroupsList />} />
          <Route path="/create-group" element={<CreateGroup />} />
          <Route path="/groups/:groupId" element={<GroupPosts />} />
          <Route path="/groups/:groupId/post" element={<CreateGroupPost />} />
          <Route path="/groups/:groupId/edit" element={<EditGroup />} />
          <Route path="/groups/:groupId/requests" element={<GroupRequests />} />
          <Route path="/groups/:groupId/members" element={<GroupMembers />} />
          <Route path="/ai-recommendation" element={<AIRecommendation />} />
            <Route path="/groups/:groupId/posts/:postId" element={<GroupPostDetails />} />
            <Route path="/groups/:groupId/posts/:postId/edit" element={<CreateGroupPost />} />
            <Route path="/groups/:groupId/posts/:postId/comments" element={<GroupPosts />} />
            <Route path="/groups/:groupId/posts/:postId/comments/:commentId" element={<GroupPosts />} />
            <Route path="/groups/:groupId/posts/:postId/comments/:commentId/edit" element={<CreateGroupPost />} />
            <Route path="/groups/:groupId/posts/:postId/comments/:commentId/delete" element={<GroupPosts />} />
            <Route path="/groups/:groupId/posts/:postId/like" element={<GroupPosts />} />
            <Route path="/groups/:groupId/posts/:postId/dislike" element={<GroupPosts />} />
            <Route path="/groups/:groupId/posts/:postId/share" element={<GroupPosts />} />
            <Route path="/groups/:groupId/posts/:postId/report" element={<GroupPosts />} />
            <Route path="/groups/:groupId/posts/:postId/save" element={<GroupPosts />} />




          {/* Course management */}
          <Route path="/all-courses" element={<AllCourses />} />
          <Route path="/create-course" element={<CreateCourse />} />
          <Route path="/course-details/:id" element={<CourseDetails />} />
          <Route path="/update-course/:id" element={<UpdateCourse />} />

          {/* Activities */}
          <Route path="/activities" element={<Activities />} />
          <Route path="/add-activity" element={<AddActivity />} />
          <Route path="/update-activity/:id" element={<UpdateActivity />} />
          <Route path="/activity/:id" element={<ActivityDetails />} />

          {/* Tutorials */}
          <Route path="/tutorials" element={<Tutorials />} />
          <Route path="/tutorials/create" element={<CreateTutorial />} />
          <Route path="/tutorials/:tutorialId" element={<TutorialDetail />} />

          {/* Recruitment */}
          <Route path="/interview-scheduler/:applicationId" element={<PickInterviewDate />} />
          <Route path="/Recruitement" element={<Recruitement />} />
          <Route path="/all-job-offers" element={<AllJobOffers />} />
          <Route path="/all-job-applications" element={<AllJobApplications />} />
          <Route path="/create-job-offer" element={<CreateJobOffer />} />
          <Route path="/apply-to-job/:jobId" element={<ApplyToJob />} />
          <Route path="/edit-job-offer/:jobId" element={<EditJobOffer />} />
          <Route path="/job-details/:jobId" element={<JobOfferDetails />} />
          <Route path="/recommended-jobs" element={<RecommendedJobs />} />


          {/* Admin dashboard */}
          <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
          />

          {/* Profile and skills */}
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/firstchoose" element={<SkillsList />} />
        </Routes>

        {!hideLayout && <Footer />}

        {/* Floating chatbot widget (visible on all pages) */}
        <ChatBot />

        <ToastContainer
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            style={{
              zIndex: 9999,
              marginTop: '4rem'
            }}
        />
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
