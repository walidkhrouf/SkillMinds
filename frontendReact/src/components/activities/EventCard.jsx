import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventCard.css';
import axios from 'axios';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const EventCard = ({ searchTerm, userRole, userId, recommendedActivities, setRecommendedActivities, filterType }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState({});
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('jwtToken');

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events');
        let filteredActivities = response.data;

        if (userRole === 'mentor') {
          filteredActivities = filteredActivities.filter(
            (activity) => activity.createdBy && activity.createdBy._id === userId
          );
        }

        setActivities(filteredActivities);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [userRole, userId]);

  const handleImageError = (id) => {
    setImageErrors((prevErrors) => ({ ...prevErrors, [id]: true }));
  };

  const handleDelete = async (id) => {
    setActivities((prevActivities) => prevActivities.filter((activity) => activity._id !== id));
    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
    } catch (err) {
      alert('Failed to delete event.');
    }
  };

  const handleParticipate = async (id) => {
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      if (!jwtToken) {
        alert("You must be logged in to participate.");
        navigate('/signin');
        return;
      }

      const activity = activities.find((activity) => activity._id === id);
      if (!activity) {
        alert("Activity not found.");
        return;
      }

      if (activity.participants.includes(userId)) {
        alert("You are already participating in this activity.");
        return;
      }

      if (activity.numberOfPlaces <= 0) {
        alert("No available places for this activity.");
        return;
      }

      if (activity.isPaid) {
        const response = await axios.post(
          `http://localhost:5000/api/events/${id}/participate`,
          {},
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );

        if (response.data.clientSecret) {
          setClientSecret(response.data.clientSecret);
          setSelectedActivityId(id);
        }
      } else {
        const response = await axios.post(
          `http://localhost:5000/api/events/${id}/participate`,
          {},
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );

        if (response.data.message === 'Successfully joined the activity') {
          const updatedActivities = activities.map((activity) =>
            activity._id === id ? response.data.activity : activity
          );
          setActivities(updatedActivities);
          setRecommendedActivities((prev) => prev.filter((rec) => rec._id !== id));
          alert("Successfully joined the activity!");
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to join the activity.');
    }
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !clientSecret) {
      alert("Stripe has not been initialized.");
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (error) {
      alert(`Payment failed: ${error.message}`);
      return;
    }

    if (paymentIntent.status === 'succeeded') {
      try {
        const jwtToken = localStorage.getItem('jwtToken');
        const response = await axios.post(
          `http://localhost:5000/api/events/${selectedActivityId}/confirm-payment`,
          {
            paymentIntentId: paymentIntent.id,
            activityId: selectedActivityId,
            userId: userId,
          },
          { headers: { Authorization: `Bearer ${jwtToken}` } }
        );

        if (response.data.message === 'Payment successful and joined the activity') {
          const updatedActivities = activities.map((activity) =>
            activity._id === selectedActivityId ? response.data.activity : activity
          );
          setActivities(updatedActivities);
          setRecommendedActivities((prev) => prev.filter((rec) => rec._id !== selectedActivityId));
          alert('Payment successful! You have joined the activity.');
        }
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to confirm payment.');
      } finally {
        setSelectedActivityId(null);
        setClientSecret('');
      }
    }
  };

  // Apply filter based on filterType
  const filteredActivities = activities.filter((activity) => {
    const matchesSearch =
      activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.location.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'free') {
      return matchesSearch && !activity.isPaid;
    } else if (filterType === 'paid') {
      return matchesSearch && activity.isPaid;
    }
    return matchesSearch; // 'all' case
  });

  // Filter recommended activities to exclude ones the user has participated in
  const filteredRecommendedActivities = recommendedActivities.filter(
    (activity) => !activity.participants.includes(userId)
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="event-cards-container">
      {/* Recommended Activities Section */}
      {filteredRecommendedActivities.length > 0 && (
        <section className="recommended-activities">
          <h2>Recommended Activities</h2>
          <div className="recommended-activities-list">
            {filteredRecommendedActivities.map((activity) => (
              <div className="items shadow recommended-item" key={activity._id}>
                <div className="img">
                  {!imageErrors[activity._id] ? (
                    <img
                      src={
                        activity.eventImage && activity.eventImage.filename
                          ? `http://localhost:5000/uploads/${activity.eventImage.filename}`
                          : ''
                      }
                      alt={activity.title}
                      onError={() => handleImageError(activity._id)}
                    />
                  ) : (
                    <h2>{activity.title}</h2>
                  )}
                </div>
                <div className="text">
                  <div className="admin flexSB">
                    <span>
                      <i className="fa fa-user"></i>
                      <label>{activity.category}</label>
                    </span>
                    <span>
                      <i className="fa fa-calendar-alt"></i>
                      <label>{new Date(activity.date).toLocaleDateString()}</label>
                    </span>
                    <span>
                      <i className="fa fa-map-marker-alt"></i>
                      <label>{activity.location}</label>
                    </span>
                    <span>
                      <i className="fa fa-users"></i>
                      <label>{activity.numberOfPlaces || 'N/A'} Places</label>
                    </span>
                    <span>
                      <i className="fa fa-dollar-sign"></i>
                      <label>{activity.isPaid ? `${activity.amount || 'N/A'}` : 'Free'}</label>
                    </span>
                  </div>
                  <h1>{activity.title}</h1>
                  <p>{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* All Activities Section */}
      <section className="all-activities">
        <h2>All Activities</h2>
        <div className="all-activities-list">
          {filteredActivities.map((activity) => (
            <div className="items shadow" key={activity._id}>
              <div className="img">
                {!imageErrors[activity._id] ? (
                  <img
                    src={
                      activity.eventImage && activity.eventImage.filename
                        ? `http://localhost:5000/uploads/${activity.eventImage.filename}`
                        : ''
                    }
                    alt={activity.title}
                    onError={() => handleImageError(activity._id)}
                  />
                ) : (
                  <h2>{activity.title}</h2>
                )}
              </div>
              <div className="text">
                <div className="admin flexSB">
                  <span>
                    <i className="fa fa-user"></i>
                    <label>{activity.category}</label>
                  </span>
                  <span>
                    <i className="fa fa-calendar-alt"></i>
                    <label>{new Date(activity.date).toLocaleDateString()}</label>
                  </span>
                  <span>
                    <i className="fa fa-map-marker-alt"></i>
                    <label>{activity.location}</label>
                  </span>
                  <span>
                    <i className="fa fa-users"></i>
                    <label>{activity.numberOfPlaces || 'N/A'} Places</label>
                  </span>
                  <span>
                    <i className="fa fa-dollar-sign"></i>
                    <label>{activity.isPaid ? `${activity.amount || 'N/A'}` : 'Free'}</label>
                  </span>
                </div>
                <h1>{activity.title}</h1>
                <p>{activity.description}</p>
                {activity.isPaid && selectedActivityId === activity._id && (
                  <div className="card-element">
                    <CardElement />
                    <button onClick={handlePayment} className="pay-btn">
                      Pay Now
                    </button>
                  </div>
                )}
                {isLoggedIn && !activity.isPaid && (
                  <button onClick={() => handleParticipate(activity._id)} className="participate-btn">
                    Participate
                  </button>
                )}
                {isLoggedIn && activity.isPaid && selectedActivityId !== activity._id && (
                  <button onClick={() => handleParticipate(activity._id)} className="participate-btn">
                    Participate
                  </button>
                )}
              </div>
              {(userRole === 'admin' || userRole === 'mentor') && (
                <div className="action-buttons">
                  <button
                    className="update-btn"
                    onClick={() => navigate(`/update-activity/${activity._id}`)}
                  >
                    ✏️
                  </button>
                  <button className="delete-btn" onClick={() => handleDelete(activity._id)}>
                    🗑️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EventCard;