import { useState, useEffect } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import './CourseQuiz.css';

const CourseQuiz = ({ courseId, onClose }) => {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [showCorrections, setShowCorrections] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`http://localhost:5000/api/courses/quiz/${courseId}`, {
          params: { userId: currentUser._id }
        });
        setQuiz(response.data.quiz);
        setError('');
      } catch (err) {
        setError(err.response?.data.message || 'Error fetching quiz. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    if (currentUser._id) {
      fetchQuiz();
    } else {
      setError('You must be logged in to access the quiz.');
      setIsLoading(false);
    }
  }, [courseId, currentUser._id]);

  const handleAnswerChange = (questionIndex, answerIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleSubmit = async () => {
    if (!quiz || Object.keys(answers).length !== quiz.questions.length) {
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
    setShowCorrections(true);
    setError('');

    if (finalScore >= 80 && finalScore <= 100) {
      try {
        if (!currentUser._id) {
          throw new Error('User not logged in');
        }
        await axios.post(`http://localhost:5000/api/courses/quiz-certificate`, {
          courseId,
          userId: currentUser._id
        });
      } catch (err) {
        console.error('Certificate generation error:', err);
        setError(err.response?.data.message || 'Failed to generate certificate. Please try again or contact support.');
      }
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setScore(null);
    setShowCorrections(false);
    setError('');
  };

  const handleClose = () => {
    onClose();
  };

  if (!currentUser._id) {
    return (
      <div className="quiz-popup">
        <div className="error">You must be logged in to access the quiz.</div>
        <button onClick={handleClose} className="close-quiz-btn">
          Close
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="quiz-popup">
        <div className="loading">Generating quiz, please wait...</div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="quiz-popup">
        <div className="error">{error || 'Failed to load quiz. Please try again.'}</div>
        <button onClick={handleClose} className="close-quiz-btn">
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="quiz-popup">
      <h2>Quiz: {quiz.courseTitle}</h2>
      {error && <p className="error">{error}</p>}
      {score !== null ? (
        <div className="quiz-result">
          <h3>Your Score: {score.toFixed(2)}%</h3>
          {score >= 80 && (
            <p>A certificate has been sent to your email.</p>
          )}
          {showCorrections && (
            <div className="corrections">
              <h4>Corrections</h4>
              {quiz.questions.map((question, qIndex) => {
                const userAnswer = answers[qIndex];
                const isCorrect = userAnswer === question.correctAnswer;
                
                return (
                  <div key={qIndex} className={`correction-item ${!isCorrect ? 'incorrect' : ''}`}>
                    <p><strong>Question {qIndex + 1}:</strong> {question.text}</p>
                    <p>
                      <strong>Your Answer:</strong>{' '}
                      {userAnswer !== undefined
                        ? question.options[userAnswer]
                        : 'Not answered'}
                      {!isCorrect && ' ❌'}
                    </p>
                    {!isCorrect && (
                      <>
                        <p><strong>Correct Answer:</strong> {question.options[question.correctAnswer]} ✅</p>
                        <p><strong>Explanation:</strong> {question.explanation}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="quiz-actions">
            <button onClick={handleRetry} className="retry-quiz-btn">
              Retry Quiz
            </button>
            <button onClick={handleClose} className="close-quiz-btn">
              Close
            </button>
          </div>
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
            <button onClick={handleSubmit} className="submit-quiz-btn">
              Submit
            </button>
            <button onClick={handleClose} className="cancel-quiz-btn">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

CourseQuiz.propTypes = {
  courseId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CourseQuiz;