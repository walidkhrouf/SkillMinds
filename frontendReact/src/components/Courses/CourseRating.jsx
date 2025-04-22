import { useState } from 'react';
import axios from 'axios';

const CourseRating = ({ courseId, currentUserId, existingRatings = [], onRatingSubmit }) => {
  const [rating, setRating] = useState('');
  const [message, setMessage] = useState('');

  const handleRating = async (e) => {
    const selectedRating = parseInt(e.target.value);
    setRating(selectedRating);

    try {
      const response = await axios.post('http://localhost:5000/api/courses/rate', {
        courseId,
        userId: currentUserId,
        rating: selectedRating
      });

      setMessage(`Merci ! Moyenne actuelle : ${response.data.averageRating}`);

      // Mise à jour parent
      if (onRatingSubmit) {
        onRatingSubmit(selectedRating);
      }
    } catch (error) {
      setMessage(error.response?.data.message || 'Erreur lors de la notation.');
    }
  };

  const userExistingRating = existingRatings.find(r => r.userId === currentUserId)?.rating;

  return (
    <div className="rating-form">
      <label htmlFor={`rating-${courseId}`}>Notez ce cours :</label>
      <select
        id={`rating-${courseId}`}
        value={rating || ''}
        onChange={handleRating}
        disabled={!currentUserId}
      >
        <option value="" disabled>Choisir une note</option>
        {[1, 2, 3, 4, 5].map(n => (
          <option key={n} value={n}>{n}</option>
        ))}
      </select>
      {userExistingRating && (
        <p className="current-rating">Votre note actuelle : {userExistingRating}</p>
      )}
      {message && <p className="rating-message">{message}</p>}
    </div>
  );
};

export default CourseRating;
