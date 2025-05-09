import { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types'; // Import PropTypes
import './CourseQuiz.css';

const CourseQuiz = ({ courseId, onClose }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [error, setError] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/courses/quiz/${courseId}`);
        setQuiz(response.data.quiz);
      } catch (err) {
        setError(err.response?.data.message || 'Error fetching quiz');
      }
    };
    fetchQuiz();
  }, [courseId]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmit = async () => {
    if (Object.keys(answers).length !== quiz.questions.length) {
      setError('Please answer all questions');
      return;
    }

    let correctCount = 0;
    quiz.questions.forEach((question, index) => {
      if (answers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = (correctCount / quiz.questions.length) * 100;
    setScore(finalScore);
    setError('');

    if (finalScore === 100) {
      try {
        if (!currentUser._id) {
          throw new Error('User not logged in');
        }
        await axios.post(`http://localhost:5000/api/courses/quiz-certificate`, {
          courseId,
          userId: currentUser._id
        });
        alert(`Congratulations! You scored 100% and a certificate has been sent to your email: ${currentUser.email}`);
      } catch (err) {
        console.error('Certificate generation error:', err);
        setError(err.response?.data.message || 'Failed to generate certificate. Please try again or contact support.');
      }
    }
  };

  if (!quiz) return <div className="loading">Loading quiz...</div>;

  return (
    <div className="quiz-popup">
      <h2>Quiz: {quiz.courseTitle}</h2>
      {error && <p className="error">{error}</p>}
      {score !== null ? (
        <div className="quiz-result">
          <h3>Your Score: {score.toFixed(2)}%</h3>
          {score === 100 && <p>A certificate has been sent to your email.</p>}
          <button onClick={onClose} className="close-quiz-btn">Close</button>
        </div>
      ) : (
        <>
          {quiz.questions.map((question, qIndex) => (
            <div key={qIndex} className="quiz-question">
              <h4>{qIndex + 1}. {question.text}</h4>
              {question.options.map((option, oIndex) => (
                <label key={oIndex} className="quiz-option">
                  <input
                    type="radio"
                    name={`question-${qIndex}`}
                    value={oIndex}
                    checked={answers[qIndex] === oIndex}
                    onChange={() => handleAnswerChange(qIndex, oIndex)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}
          <div className="quiz-actions">
            <button onClick={handleSubmit} className="submit-quiz-btn">Submit</button>
            <button onClick={onClose} className="cancel-quiz-btn">Cancel</button>
          </div>
        </>
      )}
    </div>
  );
};

// Add PropTypes validation
CourseQuiz.propTypes = {
  courseId: PropTypes.string.isRequired, // Assuming courseId is a string
  onClose: PropTypes.func.isRequired, // onClose is a function
};

export default CourseQuiz;