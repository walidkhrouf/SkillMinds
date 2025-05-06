import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ActivityDetails.css';

const ActivityDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isCommentSubmitting, setIsCommentSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [commentsPerPage] = useState(5);
  const [totalComments, setTotalComments] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [userRole, setUserRole] = useState(null);

  const isLoggedIn = !!localStorage.getItem('jwtToken');

  const getCurrentUserInfo = () => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        return {
          userId: decoded.userId || decoded.id,
          role: decoded.role,
        };
      } catch (e) {
        console.error('Error decoding token:', e);
        return { userId: null, role: null };
      }
    }
    return { userId: null, role: null };
  };

  const { userId: currentUserId, role: currentUserRole } = getCurrentUserInfo();

  // Check if the current user is participating in the activity
  const isUserParticipating = activity?.participants?.some(
    (participant) => participant._id === currentUserId || participant === currentUserId
  ) || false;

  useEffect(() => {
    setUserRole(currentUserRole);
    const fetchActivityData = async () => {
      try {
        const activityResponse = await axios.get(`http://localhost:5000/api/events/${id}`);
        setActivity(activityResponse.data);
        setTotalComments(activityResponse.data.comments.length);

        if (isLoggedIn) {
          const jwtToken = localStorage.getItem('jwtToken');
          const ratingResponse = await axios.get(
            `http://localhost:5000/api/events/${id}/rating`,
            { headers: { Authorization: `Bearer ${jwtToken}` } }
          );
          setUserRating(ratingResponse.data.userRating || 0);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch activity details');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchActivityData();
  }, [id, isLoggedIn, currentUserRole]);

  const handleRatingSubmit = async (rating) => {
    if (!isLoggedIn) {
      toast.warn('Please log in to rate this activity');
      navigate('/signin');
      return;
    }

    // Only learners need to participate to rate
    if (userRole === 'learner' && !isUserParticipating) {
      toast.warn('You must participate in this activity to rate it');
      return;
    }

    setIsSubmitting(true);
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `http://localhost:5000/api/events/${id}/rate`,
        { rating },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setActivity(response.data.activity);
      setUserRating(rating);
      toast.success('Rating submitted successfully!');
    } catch (err) {
      console.error('Rating submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.warn('Please log in to comment on this activity');
      navigate('/signin');
      return;
    }

    if (!commentText.trim()) {
      toast.warn('Comment cannot be empty');
      return;
    }

    setIsCommentSubmitting(true);
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      const response = await axios.post(
        `http://localhost:5000/api/events/${id}/comment`,
        { text: commentText },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setActivity(response.data.activity);
      setTotalComments(response.data.activity.comments.length);
      setCommentText('');
      toast.success('Comment added successfully!');
    } catch (err) {
      console.error('Comment submission error:', err);
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setIsCommentSubmitting(false);
    }
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment._id);
    setEditCommentText(comment.text);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentText.trim()) {
      toast.warn('Comment cannot be empty');
      return;
    }

    try {
      const jwtToken = localStorage.getItem('jwtToken');
      const response = await axios.put(
        `http://localhost:5000/api/events/${id}/comment/${commentId}`,
        { text: editCommentText },
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setActivity(response.data.activity);
      setEditingCommentId(null);
      setEditCommentText('');
      toast.success('Comment updated successfully!');
    } catch (err) {
      console.error('Comment update error:', err);
      toast.error(err.response?.data?.message || 'Failed to update comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      await axios.delete(
        `http://localhost:5000/api/events/${id}/comment/${commentId}`,
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setActivity((prev) => ({
        ...prev,
        comments: prev.comments.filter((comment) => comment._id !== commentId),
      }));
      setTotalComments((prev) => prev - 1);
      toast.success('Comment deleted successfully!');
    } catch (err) {
      console.error('Comment deletion error:', err);
      toast.error(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const calculateAverageRating = () => {
    if (!activity?.ratings || activity.ratings.length === 0) return 0;
    const sum = activity.ratings.reduce((total, r) => total + r.rating, 0);
    return sum / activity.ratings.length;
  };

  const displayAverage = activity?.averageRating ?? calculateAverageRating();

  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = activity?.comments?.slice(indexOfFirstComment, indexOfLastComment) || [];
  const totalPages = Math.ceil(totalComments / commentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!activity) return <div className="error">Activity not found</div>;

  return (
    <div className="activity-details-container">
      <div className="activity-header">
        <h1>{activity.title}</h1>
        <div className="activity-meta">
          <span>
            <i className="fa fa-folder"></i> {activity.category}
          </span>
          <span>
            <i className="fa fa-calendar-alt"></i> {new Date(activity.date).toLocaleDateString()}
          </span>
          <span>
            <i className="fa fa-map-marker-alt"></i> {activity.location}
          </span>
        </div>
      </div>

      <div className="activity-content">
        <div className="activity-image">
          {activity.eventImage?.filename ? (
            <img
              src={`http://localhost:5000/uploads/${activity.eventImage.filename}`}
              alt={activity.title}
            />
          ) : (
            <div className="no-image">
              <i className="fa fa-image"></i>
              <span>No Image Available</span>
            </div>
          )}
        </div>

        <div className="activity-info">
          <div className="description">
            <h2>About This Activity</h2>
            <p>{activity.description}</p>
          </div>

          <div className="details">
            <div className="detail-item">
              <i className="fa fa-users"></i>
              <div>
                <span className="label">Places Available:</span>
                <span className="value">{activity.numberOfPlaces || 'Unlimited'}</span>
              </div>
            </div>
            <div className="detail-item">
              <i className="fa fa-dollar-sign"></i>
              <div>
                <span className="label">Price:</span>
                <span className="value">{activity.isPaid ? `$${activity.amount}` : 'Free'}</span>
              </div>
            </div>
            {isLoggedIn && (userRole === 'admin' || userRole === 'mentor' || isUserParticipating) && activity.link && (
              <div className="detail-item">
                <i className="fa fa-link"></i>
                <div>
                  <span className="label">Event Link:</span>
                  <a
                    href={activity.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="value link"
                  >
                    {activity.link}
                  </a>
                </div>
              </div>
            )}
            {isLoggedIn && userRole === 'learner' && !isUserParticipating && activity.link && (
              <div className="detail-item">
                <p className="login-message">
                  You must participate in this activity to view the event link
                </p>
              </div>
            )}
            {!isLoggedIn && activity.link && (
              <div className="detail-item">
                <p className="login-message">
                  Please <Link to={`/signin?redirect=/activity/${id}`}>log in</Link> to participate and view the event link
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rating-stats">
        <span>Average: {displayAverage.toFixed(1)}</span>
        <span>Total ratings: {activity.ratings?.length || 0}</span>
      </div>

      {isLoggedIn && (userRole === 'admin' || userRole === 'mentor' || isUserParticipating) && (
        <div className="rating-section">
          <h3>Rate this activity</h3>
          <div className="star-rating">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={isSubmitting}
                className={`star-btn ${star <= (hoverRating || userRating) ? 'filled' : ''}`}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => handleRatingSubmit(star)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}
      {isLoggedIn && userRole === 'learner' && !isUserParticipating && (
        <p className="login-message">You must participate in this activity to rate it</p>
      )}
      {!isLoggedIn && (
        <p className="login-message">
          Please <Link to={`/signin?redirect=/activity/${id}`}>log in</Link> to participate and rate this activity
        </p>
      )}

      <div className="comments-section">
        <h3>Comments ({totalComments})</h3>
        <div className="comments-list">
          {currentComments.length > 0 ? (
            currentComments.map((comment, index) => (
              <div key={index} className="comment">
                <div className="comment-header">
                  <div className="comment-user-info">
                    {comment.userId?.profileImage ? (
                      <img
                        src={`http://localhost:5000/api/files/${
                          comment.userId.profileImage._id || comment.userId.profileImage
                        }`}
                        alt={comment.userId.username}
                        className="comment-user-avatar"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const defaultAvatar = e.target.nextSibling;
                          if (defaultAvatar) defaultAvatar.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className="comment-user-avatar default-avatar"
                      style={{
                        display: comment.userId?.profileImage ? 'none' : 'flex',
                      }}
                    >
                      {comment.userId?.username?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <span className="comment-username">
                      {comment.userId?.username || 'Anonymous'}
                    </span>
                  </div>
                  <span className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString()}
                    {comment.updatedAt && ' (Edited)'}
                  </span>
                </div>

                {editingCommentId === comment._id ? (
                  <div className="comment-edit">
                    <textarea
                      value={editCommentText}
                      onChange={(e) => setEditCommentText(e.target.value)}
                      rows="3"
                    />
                    <div className="comment-edit-actions">
                      <button
                        onClick={() => handleUpdateComment(comment._id)}
                        disabled={!editCommentText.trim()}
                      >
                        Save
                      </button>
                      <button onClick={() => setEditingCommentId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="comment-text">{comment.text}</p>
                    {isLoggedIn && currentUserId === comment.userId?._id && (
                      <div className="comment-actions">
                        <button
                          onClick={() => handleEditComment(comment)}
                          className="action-icon edit-icon"
                          title="Edit Comment"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="action-icon delete-icon"
                          title="Delete Comment"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))
          ) : (
            <p>No comments yet. Be the first to comment!</p>
          )}
        </div>

        {totalComments > commentsPerPage && (
          <div className="pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                onClick={() => paginate(i + 1)}
                className={currentPage === i + 1 ? 'active' : ''}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        {isLoggedIn && userRole !== 'admin' && (
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add your comment..."
              rows="4"
              disabled={isCommentSubmitting}
            />
            <button
              type="submit"
              disabled={isCommentSubmitting || !commentText.trim()}
            >
              {isCommentSubmitting ? 'Submitting...' : 'Post Comment'}
            </button>
          </form>
        )}
        {!isLoggedIn && (
          <p className="login-message">Please log in to add a comment</p>
        )}
      </div>
    </div>
  );
};

export default ActivityDetails;