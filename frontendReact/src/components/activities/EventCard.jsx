import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        setActivities(response.data); // No filtering for mentors or admins
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };
    fetchActivities();
  }, [userRole, userId]);

  // Function to check if an event is past
  const isPastEvent = (eventDate) => {
    const today = new Date();
    const event = new Date(eventDate);
    today.setHours(0, 0, 0, 0);
    event.setHours(0, 0, 0, 0);
    return event < today;
  };

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

      const activity = [...activities, ...recommendedActivities].find((activity) => activity._id === id);
      if (!activity) {
        toast.error('Activity not found.', { position: "top-center" });
        return;
      }

      if (isPastEvent(activity.date)) {
        toast.warn('This event has already finished.', { position: "top-center" });
        return;
      }

      const isParticipating = activity.participants.some(
        (participant) => participant._id === userId || participant === userId
      );

      if (isParticipating) {
        toast.info('You are already participating in this activity.', { position: "top-center" });
        return;
      }

      if (activity.numberOfPlaces <= 0) {
        toast.warn('No available places for this activity.', { position: "top-center"} );
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

    const activity = [...activities, ...recommendedActivities].find((activity) => activity._id === selectedActivityId);
    if (!activity || isPastEvent(activity.date)) {
      toast.warn('This event has already finished.', { position: "top-center" });
      setSelectedActivityId(null);
      setClientSecret('');
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

  // Filter and sort activities
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

  // Split into upcoming and finished activities
  const upcomingActivities = filteredActivities
    .filter((activity) => !isPastEvent(activity.date))
    .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending

  const finishedActivities = filteredActivities
    .filter((activity) => isPastEvent(activity.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

  const filteredRecommendedActivities = recommendedActivities
    .filter(
      (activity) =>
        !activity.participants.some((participant) => participant._id === userId || participant === userId)
    )
    .sort((a, b) => {
      const aIsPast = isPastEvent(a.date);
      const bIsPast = isPastEvent(b.date);
      if (!aIsPast && bIsPast) return -1; // Upcoming first
      if (aIsPast && !bIsPast) return 1; // Finished last
      return aIsPast
        ? new Date(b.date) - new Date(a.date) // Finished: descending
        : new Date(a.date) - new Date(b.date); // Upcoming: ascending
    });

  const isUserParticipating = (activity) => {
    return activity.participants.some(
      (participant) => participant._id === userId || participant === userId
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
              <div
                className={`items shadow recommended-item ${isPastEvent(activity.date) ? 'past-event' : ''}`}
                key={activity._id}
              >
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
                  {isPastEvent(activity.date) && <span className="ended-badge">Finished</span>}
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
                    {/* Description omitted for recommended activities */}
                  </Link>

                  {activity.isPaid && selectedActivityId === activity._id && !isPastEvent(activity.date) && (
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
                    {userRole !== 'admin' && userRole !== 'mentor' &&
                      !isUserParticipating(activity) &&
                      !isPastEvent(activity.date) &&
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
      )}

      <section className="all-activities">
        {upcomingActivities.length > 0 && (
          <>
            <h2>Upcoming Activities</h2>
            <div className="all-activities-list">
              {upcomingActivities.map((activity) => (
                <div
                  className={`items shadow ${isPastEvent(activity.date) ? 'past-event' : ''}`}
                  key={activity._id}
                >
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
                    {isPastEvent(activity.date) && <span className="ended-badge">Finished</span>}
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
                    </Link>

                    {activity.isPaid && selectedActivityId === activity._id && !isPastEvent(activity.date) && (
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
                      {userRole !== 'admin' && userRole !== 'mentor' &&
                        !isUserParticipating(activity) &&
                        !isPastEvent(activity.date) &&
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
          </>
        )}

        {finishedActivities.length > 0 && (
          <>
            <h2>Finished Activities</h2>
            <div className="all-activities-list">
              {finishedActivities.map((activity) => (
                <div
                  className={`items shadow ${isPastEvent(activity.date) ? 'past-event' : ''}`}
                  key={activity._id}
                >
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
                    {isPastEvent(activity.date) && <span className="ended-badge">Finished</span>}
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
                    </Link>

                    {activity.isPaid && selectedActivityId === activity._id && !isPastEvent(activity.date) && (
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
                      {userRole !== 'admin' && userRole !== 'mentor' &&
                        !isUserParticipating(activity) &&
                        !isPastEvent(activity.date) &&
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
          </>
        )}
      </section>
    </div>
  );
};

export default EventCard;