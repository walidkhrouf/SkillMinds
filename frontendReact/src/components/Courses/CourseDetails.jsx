import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import GroupDiscussion from './GroupDiscussion';
import CourseQuiz from './CourseQuiz';
import './CourseDetails.css';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [error, setError] = useState('');
  const [showQuiz, setShowQuiz] = useState(false);
  const [playingIndex, setPlayingIndex] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const videoRefs = useRef([]);
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    const fetchCourseAndEnrollment = async () => {
      try {
        const courseResponse = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          params: { userId: currentUser._id },
        });
        setCourse(courseResponse.data.course);
        
        if (courseResponse.data.enrollments) {
          setEnrollments(courseResponse.data.enrollments);
        }

        if (currentUser._id) {
          try {
            const enrollmentResponse = await axios.get('http://localhost:5000/api/courses/enroll', {
              params: { userId: currentUser._id, courseId: id },
            });
            setEnrollment(enrollmentResponse.data);
          } catch (err) {
            setEnrollment(null);
          }
        }

        const commentsResponse = await axios.get('http://localhost:5000/api/courses/comments/list', {
          params: { courseId: id }
        });
        setComments(commentsResponse.data);
      } catch (err) {
        setError(err.response?.data.message || 'Error fetching course details');
      }
    };
    
    fetchCourseAndEnrollment();
  }, [id, currentUser._id]);

  useEffect(() => {
    let timer;
    if (error && error.includes('bad word')) {
      timer = setTimeout(() => {
        setError('');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [error]);

  const handleEnroll = async () => {
    try {
      await axios.post('http://localhost:5000/api/courses/enroll', {
        courseId: id,
        userId: currentUser._id,
      });

      const enrollmentResponse = await axios.get('http://localhost:5000/api/courses/enroll', {
        params: { userId: currentUser._id, courseId: id },
      });
      setEnrollment(enrollmentResponse.data);
      setError('');
      alert('Successfully enrolled!');
    } catch (err) {
      setError(err.response?.data.message || 'Error enrolling in course');
    }
  };

  const handleDownloadVideo = async (videoOrder) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/courses/video/${id}/${videoOrder - 1}`, {
        params: { userId: currentUser._id },
        responseType: 'blob',
      });

      const video = course.videos.find((v) => v.order === videoOrder);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', video.filename || `video-${videoOrder}.mp4`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.response?.data.message || 'Error downloading video');
    }
  };

  const handleVideoPlay = (index) => {
    setPlayingIndex(index);
  };

  const handleVideoPause = () => {
    setPlayingIndex(null);
  };

  const handleNextVideo = (currentIndex) => {
    if (course.videos.length <= 1 || currentIndex >= course.videos.length - 1) {
      return;
    }

    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.pause();
    }

    const nextIndex = currentIndex + 1;
    const nextVideo = videoRefs.current[nextIndex];
    if (nextVideo) {
      nextVideo.play();
    }
  };

  const submitComment = async () => {
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/courses/comments/create', {
        courseId: id,
        userId: currentUser._id,
        content: newComment
      });
      setComments([response.data, ...comments]);
      setNewComment('');
      setError('');
    } catch (err) {
      const errorMessage = err.response?.data.message || 'Error submitting comment';
      setError(errorMessage);
    }
  };

  const toggleDescription = () => {
    setIsDescriptionExpanded(!isDescriptionExpanded);
  };

  if (!course) return <div className="loading">Loading...</div>;

  const isEnrolled = !!enrollment;
  const isCreator = course.createdBy?._id === currentUser._id;
  const canDownload = isEnrolled || isCreator;
  const description = course.description || 'No description available';
  const truncatedDescription = description.length > 100 ? description.slice(0, 100) + '...' : description;

  return (
    <div className="course-details">  <br/>  <br/>
      <h1>{course.title}</h1>
      <div className="description-section">
        <p>{isDescriptionExpanded ? description : truncatedDescription}</p>
        {description.length > 100 && (
          <button onClick={toggleDescription} className="toggle-description-btn">
            {isDescriptionExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>
      <p><strong>Skill:</strong> {course.skillId?.name}</p>
      <p><strong>Price:</strong> ${course.price}</p>
      <p><strong>Created By:</strong> {course.createdBy?.username}</p>

      {(isEnrolled || isCreator) ? (
        <>
          <h2>Videos</h2>
          {course.videos.map((video, index) => (
            <div key={index} className="video-section">
              <p>Section {index + 1}</p>
              {playingIndex === index && (
                <p className="currently-watching">Currently Watching</p>
              )}
              <video
                width="320"
                height="240"
                controls
                ref={(el) => (videoRefs.current[index] = el)}
                onPlay={() => handleVideoPlay(index)}
                onPause={handleVideoPause}
                onEnded={handleVideoPause}
              >
                <source
                  src={`http://localhost:5000/api/courses/video/${id}/${index}?userId=${currentUser._id}`}
                  type={video.contentType}
                />
                Your browser does not support the video tag.
              </video>
              <div className="video-buttons">
                {canDownload && (
                  <button
                    onClick={() => handleDownloadVideo(index + 1)}
                    className="download-btn"
                  >
                    Download Video
                  </button>
                )}
                {index < course.videos.length - 1 && (
                  <button
                    onClick={() => handleNextVideo(index)}
                    className="next-btn"
                  >
                    Next Video
                  </button>
                )}
              </div>
            </div>
          ))}
          {(isEnrolled || isCreator) && (
            <button onClick={() => setShowQuiz(true)} className="quiz-btn">
              Take Quiz
            </button>
          )}
        </>
      ) : (
        <p className="not-enrolled-message">
          You must enroll in this course to view the videos.
        </p>
      )}

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

      {isEnrolled && currentUser._id && (
        <GroupDiscussion courseId={id} userId={currentUser._id} />
      )}

      <div className="comments-section">
        <h3>Comments</h3>
        {currentUser._id && (
          <>
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows="3"
            />
            {error && <p className="error">{error}</p>}
            <button onClick={submitComment} className="comment-submit-btn">
              Submit Comment
            </button>
          </>
        )}
        {comments.length === 0 ? (
          <p>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment._id} className="comment">
              <p>
                <strong>{comment.userId?.username}</strong>: {comment.content}
              </p>
              <small>{new Date(comment.createdAt).toLocaleString()}</small>
            </div>
          ))
        )}
      </div>

      {isCreator && (
        <>
          <h2>Enrolled Users</h2>
          {enrollments.length === 0 ? (
            <p>No enrollments yet.</p>
          ) : (
            enrollments.map((enroll) => (
              <div key={enroll._id} className="enrollment-card">
                <p><strong>User:</strong> {enroll.userId?.username}</p>
                <p><strong>Email:</strong> {enroll.userId?.email}</p>
              </div>
            ))
          )}
        </>
      )}

      {showQuiz && (
        <CourseQuiz
          courseId={id}
          onClose={() => setShowQuiz(false)}
        />
      )}

      <button onClick={() => navigate('/all-courses')} className="back-btn">
        Back to Courses
      </button>
    </div>
  );
};

export default CourseDetails;