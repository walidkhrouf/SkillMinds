import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AllCourses.css';
import StripePayment from './StripePayment';
import CourseRating from './CourseRating';

const AllCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [enrollments, setEnrollments] = useState({});
  const [error, setError] = useState('');
  const [selectedCourseForPayment, setSelectedCourseForPayment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const coursesPerPage = 3;

  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    const fetchCoursesAndEnrollments = async () => {
      try {
        const coursesResponse = await axios.get('http://localhost:5000/api/courses');
        const fetchedCourses = coursesResponse.data;
        setCourses(fetchedCourses);

        if (currentUser._id) {
          const enrollmentPromises = fetchedCourses.map(course =>
            axios.get('http://localhost:5000/api/courses/enroll', {
              params: { userId: currentUser._id, courseId: course._id }
            }).catch(() => ({ data: null }))
          );

          const enrollmentResponses = await Promise.all(enrollmentPromises);
          const enrollmentMap = {};
          enrollmentResponses.forEach((response, index) => {
            if (response.data) {
              enrollmentMap[fetchedCourses[index]._id] = response.data;
            }
          });
          setEnrollments(enrollmentMap);
        }
      } catch (err) {
        setError(err.response?.data.message || 'Error fetching courses');
      }
    };
    fetchCoursesAndEnrollments();
  }, [currentUser._id]);

  const handleEnroll = async (courseId) => {
    try {
      await axios.post('http://localhost:5000/api/courses/enroll', {
        courseId,
        userId: currentUser._id
      });

      const enrollmentResponse = await axios.get('http://localhost:5000/api/courses/enroll', {
        params: { userId: currentUser._id, courseId }
      });
      setEnrollments(prev => ({
        ...prev,
        [courseId]: enrollmentResponse.data
      }));
      navigate(`/course-details/${courseId}`);
    } catch (err) {
      setError(err.response?.data.message || 'Error enrolling');
    }
  };

  const handleUpdate = (courseId) => {
    navigate(`/update-course/${courseId}`);
  };

  const handleDelete = async (courseId) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await axios.delete(`http://localhost:5000/api/courses/${courseId}`, {
          params: { userId: currentUser._id }
        });
        setCourses(courses.filter(course => course._id !== courseId));
      } catch (err) {
        setError(err.response?.data.message || 'Error deleting course');
      }
    }
  };

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on new search

    if (value.trim() === '') {
      setFilteredCourses([]);
      return;
    }

    const filtered = courses.filter(course =>
      course.title.toLowerCase().includes(value)
    );

    if (filtered.length > 0) {
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses([]);
    }
  };

  const sortCoursesByPrice = () => {
    const sortedCourses = [...courses].sort((a, b) => a.price - b.price);
    setCourses(sortedCourses);
    setCurrentPage(1); // Reset to first page after sorting
  };

  const handlePaymentSuccess = (courseId, enrollmentData) => {
    setEnrollments(prev => ({
      ...prev,
      [courseId]: enrollmentData
    }));
    setSelectedCourseForPayment(null);
    setFilteredCourses([]);
    setSearchTerm('');
    setError('');
    setCurrentPage(1); // Reset to first page after payment
  };

  // Pagination logic
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = (filteredCourses.length > 0 ? filteredCourses : courses).slice(indexOfFirstCourse, indexOfLastCourse);
  const totalPages = Math.ceil((filteredCourses.length > 0 ? filteredCourses.length : courses.length) / coursesPerPage);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  return (
    <section className="all-courses"> <br></br> <br></br>
      <h1>All Courses</h1>
      {error && <p className="error">{error}</p>}

      <input
        type="text"
        placeholder="Search for a course..."
        className="search-bar"
        value={searchTerm}
        onChange={handleSearch}
      />

      <button onClick={sortCoursesByPrice} className="sort-btn">
        Sort by Price
      </button>

      <div className="courses-grid">
        {currentCourses.map((course) => (
          <div className="course-item" key={course._id}>
            <h2>{course.title}</h2>
            <p>{course.description || 'No description available'}</p>
            <p><strong>Price:</strong> ${course.price}</p>
            <p><strong>Created By:</strong> {course.createdBy?.username}</p>

            {currentUser._id === course.createdBy?._id && (
              <>
                <button onClick={() => handleUpdate(course._id)} className="update-btn">
                  Update
                </button>
                <button onClick={() => handleDelete(course._id)} className="delete-btn">
                  Delete
                </button>
              </>
            )} <br></br> <br></br>
            <button onClick={() => navigate(`/course-details/${course._id}`)} className="view-btn">
              View Details
            </button>
            {course.price > 0 && !enrollments[course._id] && (
              <button onClick={() => setSelectedCourseForPayment(course._id)} className="pay-btn">
                Pay
              </button>
            )}
            {course.price === 0 && !enrollments[course._id] && (
              <button onClick={() => handleEnroll(course._id)} className="enroll-free-btn">
                Enroll for Free
              </button>
            )}

            <CourseRating
              courseId={course._id}
              currentUserId={currentUser._id}
              existingRatings={course.ratings || []}
              onRatingSubmit={(newRating) => {
                setCourses(prevCourses =>
                  prevCourses.map(c =>
                    c._id === course._id
                      ? {
                          ...c,
                          ratings: [
                            ...(c.ratings || []).filter(r => r.userId !== currentUser._id),
                            { userId: currentUser._id, rating: newRating }
                          ]
                        }
                      : c
                  )
                );
              }}
            />
          </div>
        ))}
        {currentCourses.length === 0 && searchTerm && (
          <p className="no-results">Le cours recherché n est pas disponible.</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="pagination-btn"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, index) => (
            <button
              key={index + 1}
              onClick={() => paginate(index + 1)}
              className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
            >
              {index + 1}
            </button>
          ))}
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}

      {selectedCourseForPayment && (
        <div className="payment-popup">
          <h3>Pay for Course</h3>
          <StripePayment
            courseId={selectedCourseForPayment}
            userId={currentUser._id}
            onPaymentSuccess={handlePaymentSuccess}
          />
          <button onClick={() => setSelectedCourseForPayment(null)} className="cancel-btn">
            Cancel
          </button>
        </div>
      )}

      <button onClick={() => navigate('/all-courses')} className="back-btn">
        Back to Home
      </button>
    </section>
  );
};

export default AllCourses;