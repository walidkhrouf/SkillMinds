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
  const [descriptionExpanded, setDescriptionExpanded] = useState({});
  const [courseToDelete, setCourseToDelete] = useState(null);
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

  const handleDelete = (courseId) => {
    setCourseToDelete(courseId);
  };

  const confirmDelete = async () => {
    if (courseToDelete) {
      try {
        await axios.delete(`http://localhost:5000/api/courses/${courseToDelete}`, {
          params: { userId: currentUser._id }
        });
        setCourses(courses.filter(course => course._id !== courseToDelete));
        setCourseToDelete(null);
      } catch (err) {
        setError(err.response?.data.message || 'Error deleting course');
        setCourseToDelete(null);
      }
    }
  };

  const cancelDelete = () => {
    setCourseToDelete(null);
  };

  const handleSearch = (event) => {
    const value = event.target.value.toLowerCase();
    setSearchTerm(value);
    setCurrentPage(1);

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
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  const toggleDescription = (courseId) => {
    setDescriptionExpanded(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

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
        {currentCourses.map((course) => {
          const description = course.description || 'No description available';
          const truncatedDescription = description.length > 100 ? description.slice(0, 100) + '...' : description;
          const isExpanded = descriptionExpanded[course._id];

          return (
            <div className="course-item" key={course._id}>
              <h2>{course.title}</h2>
              <div className="description-section">
                <p>{isExpanded ? description : truncatedDescription}</p>
                {description.length > 100 && (
                  <button onClick={() => toggleDescription(course._id)} className="toggle-description-btn">
                    {isExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
              <p><strong>Price:</strong> ${course.price}</p>
              <p><strong>Created By:</strong> {course.createdBy?.username}</p>

              {currentUser._id === course.createdBy?._id && (
                <div className="course-actions">
                  <button onClick={() => handleUpdate(course._id)} className="update-btn">
                    Update
                  </button>
                  <button onClick={() => handleDelete(course._id)} className="delete-btn">
                    Delete
                  </button>
                </div>
              )}
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
          );
        })}
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

      {courseToDelete && (
        <div className="confirmation-popup">
          <h3>Confirmer la suppression</h3>
          <p>Êtes-vous sûr de vouloir supprimer ce cours ?</p>
          <button onClick={confirmDelete} className="confirm-btn">
            Confirmer
          </button>
          <button onClick={cancelDelete} className="cancel-btn">
            Annuler
          </button>
        </div>
      )}

      <button onClick={() => navigate('/courses')} className="back-btn">
        Back to Home
      </button>
    </section>
  );
};

export default AllCourses;