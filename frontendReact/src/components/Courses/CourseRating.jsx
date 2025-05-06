import { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';

const CourseRating = ({ courseId, currentUserId, existingRatings = [], onRatingSubmit }) => {
  const [rating, setRating] = useState('');
  const [hoverRating, setHoverRating] = useState(0);

  // Example usage of existingRatings (uncomment if needed)
  // useEffect(() => {
  //   if (existingRatings.length > 0) {
  //     const userRating = existingRatings.find(r => r.userId === currentUserId);
  //     if (userRating) setRating(userRating.rating);
  //   }
  // }, [existingRatings, currentUserId]);

  const handleRating = async (selectedRating) => {
    setRating(selectedRating);

    try {
      await axios.post('http://localhost:5000/api/courses/rate', {
        courseId,
        userId: currentUserId,
        rating: selectedRating
      });

      if (onRatingSubmit) {
        onRatingSubmit(selectedRating);
      }
    } catch (error) {
      console.error(error.response?.data.message || 'Erreur lors de la notation.');
    }
  };

  return (
    <div className="rating-form">
      <style>
        {`
          .rating-form {
            margin-top: 10px;
            font-family: Arial, sans-serif;
          }
          .star-rating {
            display: inline-flex;
            flex-direction: row-reverse;
            font-size: 24px;
            cursor: ${currentUserId ? 'pointer' : 'not-allowed'};
          }
          .star {
            color: #ccc;
            margin: 0 2px;
            transition: color 0.2s;
          }
          .star.filled,
          .star:hover,
          .star:hover ~ .star {
            color: #ffd700;
          }
          .star-rating.disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }
        `}
      </style>
      <h3 style={{fontWeight:'bold'}}>Rating :</h3> <br /> 
      <div className={`star-rating ${!currentUserId ? 'disabled' : ''}`}>
        {[5, 4, 3, 2, 1].map((star) => (
          <span
            key={star}
            className={`star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
            onClick={() => currentUserId && handleRating(star)}
            onMouseEnter={() => currentUserId && setHoverRating(star)}
            onMouseLeave={() => currentUserId && setHoverRating(0)}
          >
            ★
          </span>
        ))}
      </div>
    </div>
  );
};

// Add prop-types validation
CourseRating.propTypes = {
  courseId: PropTypes.string.isRequired,
  currentUserId: PropTypes.string,
  existingRatings: PropTypes.arrayOf(
    PropTypes.shape({
      userId: PropTypes.string,
      rating: PropTypes.number
    })
  ),
  onRatingSubmit: PropTypes.func
};

// Define default props if needed
CourseRating.defaultProps = {
  existingRatings: [],
  onRatingSubmit: null
};

export default CourseRating;