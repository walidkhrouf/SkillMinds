import Back from "../common/back/Back";
// import CoursesCard from "./CoursesCard";
// import OnlineCourses from "./OnlineCourses";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const CourseHome = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({});

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser')) || {};
    setCurrentUser(user);
  }, []);

  return (
    <>
      <Back title="Explore Courses" />
      {/* <CoursesCard /> */}
      <div className="coursesCard">
        <div className="courses-actions">
          <button
            onClick={() => navigate('/all-courses')}
            className="explore-btn outline-btn" 
          >
            EXPLORE MORE COURSES
          </button>
          {currentUser._id && (
            <button
              onClick={() => navigate('/create-course')}
              className="add-btn outline-btn"
            >
              ADD COURSES
            </button>
          )}
        </div>
      </div>
      {/* <OnlineCourses /> */}
    </>
  );
};

export default CourseHome;
