import React, { useEffect, useState } from 'react';
import './EventCard.css'; 
import axios from 'axios';

const EventCard = ({ searchTerm }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events');
        setActivities(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const handleImageError = (id) => {
    setImageErrors((prevErrors) => ({ ...prevErrors, [id]: true }));
  };

  const handleDelete = async (id) => {
    setActivities((prevActivities) => prevActivities.filter(activity => activity._id !== id));

    try {
      await axios.delete(`http://localhost:5000/api/events/${id}`);
    } catch (err) {
      console.error("Error deleting event:", err);
      alert("Failed to delete event.");
    }
  };

  const filteredActivities = activities.filter((activity) =>
    activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="event-cards-container">
      {filteredActivities.map((activity) => (
        <div className='items shadow' key={activity._id}>
          <div className='img'>
            {!imageErrors[activity._id] ? (
              <img
                src={activity.eventImage && activity.eventImage.filename 
                  ? `http://localhost:5000/uploads/${activity.eventImage.filename}` 
                  : ""}
                alt={activity.title}
                onError={() => handleImageError(activity._id)}
              />
            ) : (
              <h2>{activity.title}</h2>
            )}
          </div>
          <div className='text'>
            <div className='admin flexSB'>
              <span>
                <i className='fa fa-user'></i>
                <label>{activity.category}</label>
              </span>
              <span>
                <i className='fa fa-calendar-alt'></i>
                <label>{new Date(activity.date).toLocaleDateString()}</label>
              </span>
              <span>
                <i className='fa fa-map-marker-alt'></i>
                <label>{activity.location}</label>
              </span>
              <span>
                <i className='fa fa-dollar-sign'></i>
                <label>
                  {activity.isPaid ? `${activity.amount || 'N/A'}` : "Free"}
                </label>
              </span>
            </div>
            <h1>{activity.title}</h1>
            <p>{activity.description}</p>
          </div>
          {/* Delete icon positioned at the bottom right */}
          <button className="delete-btn" onClick={() => handleDelete(activity._id)}>
            <i className="fa fa-trash-alt"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export default EventCard;
