import React, { useEffect, useState } from 'react';
import 
   
{ useNavigate, Link } from 'react-router-dom';
import './EventCard.css';
import axios from 'axios';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-toastify';

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
      toast.success('Event deleted successfully!', { position: "top-center" });
    } catch (err) {
      toast.error('Failed to delete event.', { position: "top-center" });
    }
  };

  const handleParticipate = async (id, e) => {
    e.stopPropagation();
    try {
      const jwtToken = localStorage.getItem('jwtToken');
      if (!jwtToken) {
        toast.warn('You must be logged in to participate.', { position: "top-center" });
        navigate('/signin');
        return;
      }

      const activity = activities.find((activity) => activity._id === id);
      if (!activity) {
        toast.error('Activity not found.', { position: "top-center" });
        return;
      }

      const isParticipating = activity.participants.some(
        participant => participant._id === userId || participant === userId
      );
      
      if (isParticipating) {
        toast.info('You are already participating in this activity.', { position: "top-center" });
        return;
      }

      if (activity.numberOfPlaces <= 0) {
        toast.warn('No available places for this activity.', { position: "top-center" });
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
          toast.success('Successfully joined the activity!', { position: "top-center" });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to join the activity.', { position: "top-center" });
    }
  };

  const handlePayment = async (e) => {
    e.stopPropagation();
    if (!stripe || !elements || !clientSecret) {
      toast.error('Stripe has not been initialized.', { position: "top-center" });
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement) },
    });

    if (error) {
      toast.error(`Payment failed: ${error.message}`, { position: "top-center" });
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
          toast.success('Payment successful! You have joined the activity.', { position: "top-center" });
        }
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to confirm payment.', { position: "top-center" });
      } finally {
        setSelectedActivityId(null);
        setClientSecret('');
      }
    }
  };

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
    return matchesSearch;
  });

  const filteredRecommendedActivities = recommendedActivities.filter(
    (activity) => !activity.participants.some(
      participant => participant._id === userId || participant === userId
    )
  );

  const isUserParticipating = (activity) => {
    return activity.participants.some(
      participant => participant._id === userId || participant === userId
    );
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="event-cards-container">
      {filteredRecommendedActivities.length > 0 && (
        <section className="recommended-activities">
          <h2>Recommended Activities</h2>
          <div className="recommended-activities-list">
            {filteredRecommendedActivities.map((activity) => (
              <div className="items shadow recommended-item" key={activity._id}>
                <div className="img">
                  <Link to={`/activity/${activity._id}`} className="image-link">
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
                  </Link>
                </div>
                <div className="text">
                  <Link to={`/activity/${activity._id}`} className="text-link">
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
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="all-activities">
        <h2>All Activities</h2>
        <div className="all-activities-list">
          {filteredActivities.map((activity) => (
            <div className="items shadow" key={activity._id}>
              <div className="img">
                <Link to={`/activity/${activity._id}`} className="image-link">
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
                </Link>
              </div>
              <div className="text">
                <Link to={`/activity/${activity._id}`} className="text-link">
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
                      <i className="fa fa-users"></i>
                      <label>{activity.numberOfPlaces || 'N/A'} Places</label>
                    </span>
                    <span>
                      <i className="fa fa-dollar-sign"></i>
                      <label>{activity.isPaid ? `${activity.amount || 'N/A'}` : 'Free'}</label>
                    </span>
                  </div>
                  <h1>{activity.title}</h1>
                 
                </Link>
                
                {activity.isPaid && selectedActivityId === activity._id && (
                  <div className="card-element">
                    <CardElement />
                    <button onClick={(e) => handlePayment(e)} className="pay-btn">
                      Pay Now
                    </button>
                  </div>
                )}
                
                <div className="action-buttons">
                  {(userRole === 'admin' || userRole === 'mentor') && (
                    <>
                      <button
                        className="update-btn"
                        onClick={() => navigate(`/update-activity/${activity._id}`)}
                      >
                        ✏️
                      </button>
                      <button className="update-btn" onClick={() => handleDelete(activity._id)}>
                        🗑️
                      </button>
                    </>
                  )}
                  {isLoggedIn && 
                   !isUserParticipating(activity) && 
                   (activity.isPaid ? selectedActivityId !== activity._id : true) && (
                    <button 
                      onClick={(e) => handleParticipate(activity._id, e)} 
                      className="participate-btn"
                    >
                      Participate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EventCard;