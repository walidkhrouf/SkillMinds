import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './CourseDetails.css';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [enrollments, setEnrollments] = useState([]); 
  const [currentVideo, setCurrentVideo] = useState(1); 
  const [error, setError] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      try {
        
        const courseResponse = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          params: { userId: currentUser._id }
        });
        setCourse(courseResponse.data.course);
        if (courseResponse.data.enrollments) setEnrollments(courseResponse.data.enrollments);

        
        if (currentUser._id) {
          try {
            const enrollmentResponse = await axios.get('http://localhost:5000/api/courses/enroll', {
              params: { userId: currentUser._id, courseId: id }
            });
            setEnrollment(enrollmentResponse.data);

            const totalVideos = courseResponse.data.course.videos.length;
            const progress = enrollmentResponse.data.progress || 0;
            const videosWatched = Math.floor((progress / 100) * totalVideos);
            setCurrentVideo(videosWatched + 1 > totalVideos ? totalVideos : videosWatched + 1);
          } catch (err) {
            
            setEnrollment(null);
          }
        }
      } catch (err) {
        setError(err.response?.data.message || 'Error fetching course details');
      }
    };
    fetchCourseAndEnrollment();
  }, [id, currentUser._id]);

  const handleEnroll = async () => {
    try {
      await axios.post('http://localhost:5000/api/courses/enroll', {
        courseId: id,
        userId: currentUser._id
      });

      const enrollmentResponse = await axios.get('http://localhost:5000/api/courses/enroll', {
        params: { userId: currentUser._id, courseId: id }
      });
      setEnrollment(enrollmentResponse.data);
      setError('');
      alert('Successfully enrolled!');
    } catch (err) {
      setError(err.response?.data.message || 'Error enrolling in course');
    }
  };

  const handleVideoEnded = async (videoOrder) => {
    if (!enrollment) return; 

    try {
      await axios.put(`http://localhost:5000/api/courses/progress/${enrollment._id}`, {
        videoOrder: videoOrder + 1, 
        userId: currentUser._id
      });
      
      const updatedEnrollment = await axios.get('http://localhost:5000/api/courses/enroll', {
        params: { userId: currentUser._id, courseId: id }
      });
      setEnrollment(updatedEnrollment.data);
      
      if (videoOrder < course.videos.length) {
        setCurrentVideo(videoOrder + 1);
      }
    } catch (err) {
      setError(err.response?.data.message || 'Error updating progress');
    }
  };

  const handleNextVideo = async () => {
    if (!enrollment || currentVideo >= course.videos.length) return; // Prevent going beyond the last video
  
    try {
      // Update progress in the backend
      await axios.put(`http://localhost:5000/api/courses/progress/${enrollment._id}`, {
        videoOrder: currentVideo + 1, // Increment video order
        userId: currentUser._id
      });
  
      // Fetch updated enrollment data
      const updatedEnrollment = await axios.get('http://localhost:5000/api/courses/enroll', {
        params: { userId: currentUser._id, courseId: id }
      });
      setEnrollment(updatedEnrollment.data);
  
      // Update the current video state
      setCurrentVideo(currentVideo + 1);
  
      // Scroll to the next video section (optional)
      document.querySelector(`.video-section:nth-child(${currentVideo + 1})`)?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data.message || 'Error updating progress');
    }
  };

  if (!course) return <div className="loading">Loading...</div>;

  const isEnrolled = !!enrollment;
  const progress = enrollment?.progress || 0;

  
  return (
    <div className="course-details">
      <h1>{course.title}</h1>
      {error && <p className="error">{error}</p>}
      <p>{course.description || 'No description available'}</p>
      <p><strong>Skill:</strong> {course.skillId?.name}</p>
      <p><strong>Price:</strong> ${course.price}</p>
      <p><strong>Created By:</strong> {course.createdBy?.username}</p>
      {isEnrolled && <p><strong>Progress:</strong> {progress}%</p>}
      {enrollment?.status === 'completed' && <p className="completed-message">Course Completed!</p>}

      <h2>Videos</h2>
      {course.videos.map((video, index) => {
  const videoOrder = index + 1; 
  const isCurrentVideo = videoOrder === currentVideo;
  return (
    <div key={index} className="video-section">
      <p>Section {videoOrder} {isCurrentVideo && '(Currently Watching)'}</p>
      <video
        width="320"
        height="240"
        controls
        autoPlay={isCurrentVideo} 
        onEnded={() => handleVideoEnded(videoOrder)} 
        className={isCurrentVideo ? 'active-video' : ''}
      >
        <source src={`http://localhost:5000/api/courses/video/${id}/${videoOrder - 1}`} type={video.contentType} />
        Your browser does not support the video tag.
      </video>
      {isCurrentVideo && currentVideo < course.videos.length && (
        <button onClick={handleNextVideo} className="next-btn">
          Next Video
        </button>
      )}
    </div>
  );
})}

      {course.createdBy?._id !== currentUser._id && (
        <>
          {isEnrolled ? (
            <p className="owned-message">You Own This Course</p>
          ) : (
            <button onClick={handleEnroll} className="enroll-btn">
              Enroll Now
            </button>
          )}
        </>
      )}

      {course.createdBy?._id === currentUser._id && (
        <>
          <h2>Enrolled Users</h2>
          {enrollments.length === 0 ? (
            <p>No enrollments yet.</p>
          ) : (
            enrollments.map(enroll => (
              <div key={enroll._id} className="enrollment-card">
                <p><strong>User:</strong> {enroll.userId?.username}</p>
                <p><strong>Email:</strong> {enroll.userId?.email}</p>
                <p><strong>Progress:</strong> {enroll.progress}%</p>
              </div>
            ))
          )}
        </>
      )}

      <button onClick={() => navigate('/all-courses')} className="back-btn">
        Back to Courses
      </button>
    </div>
  );
};

export default CourseDetails;