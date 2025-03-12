import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import MapComponent from './MapComponent';
import CalendlyWidget from './CalendlyWidget';
import DatePicker from 'react-datepicker'; // Import React Date Picker
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS for the date picker
import './UpdateActivity.css';

const UpdateActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: null, // Initialize with null for DatePicker
    location: '',
    numberOfPlaces: '',
    isPaid: false,
    amount: '',
    link: '',
    eventImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCalendlyWidget, setShowCalendlyWidget] = useState(false);

  // Function to disable weekends
  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // Disable Sunday (0) and Saturday (6)
  };

  // Fetch the existing activity data
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
          setError('You must be logged in to update an activity.');
          navigate('/signin');
          return;
        }

        const response = await axios.get(`http://localhost:5000/api/events/${id}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        const activity = response.data;
        setFormData({
          title: activity.title,
          description: activity.description,
          category: activity.category,
          date: new Date(activity.date), // Convert date to Date object
          location: activity.location,
          numberOfPlaces: activity.numberOfPlaces,
          isPaid: activity.isPaid,
          amount: activity.amount,
          link: activity.link,
          eventImage: activity.eventImage,
        });
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred while fetching the activity.');
        if (err.response?.status === 401) {
          navigate('/signin');
        }
      }
    };

    fetchActivity();
  }, [id, navigate]);

  // Handle location selection from the map
  const handleMapLocationSelect = useCallback(async (coordinates) => {
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coordinates[1]}&lon=${coordinates[0]}`
      );
      const address = response.data.display_name;
      setFormData((prev) => ({
        ...prev,
        location: address,
      }));
    } catch (err) {
      setError('Failed to fetch address. Please try again.');
    }
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
    setSuccess('');
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      date: date,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Event image must be a valid image file (e.g., JPG, PNG).');
        setFormData((prev) => ({ ...prev, eventImage: null }));
      } else {
        setError('');
        setFormData((prev) => ({
          ...prev,
          eventImage: file,
        }));
      }
    }
  };

  const handleCalendlyDateSelect = ({ eventLink }) => {
    setFormData((prev) => ({
      ...prev,
      link: eventLink,
    }));
    setShowCalendlyWidget(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const jwtToken = localStorage.getItem('jwtToken');
    if (!jwtToken) {
      setError('You must be logged in to update an activity.');
      navigate('/signin');
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = new FormData();
      for (const key in formData) {
        if (key === 'eventImage') {
          if (formData.eventImage) {
            dataToSubmit.append('eventImage', formData.eventImage);
          }
        } else {
          dataToSubmit.append(key, formData[key]);
        }
      }

      const response = await axios.put(`http://localhost:5000/api/events/${id}`, dataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      setSuccess('Activity updated successfully!');
      setError('');
      setTimeout(() => navigate('/activities'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating the activity.');
      setSuccess('');
      if (err.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-activity-container">
      <div className="left-box">
        <div className="auth-container">
          <h2>Update Activity</h2>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-columns">
              {/* Left Column */}
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="title">Title:</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    placeholder="Enter activity title"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Enter activity description"
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="date">Date:</label>
                  <DatePicker
                    selected={formData.date}
                    onChange={handleDateChange}
                    filterDate={isWeekday} // Disable weekends
                    minDate={new Date()} // Disable past dates
                    dateFormat="yyyy-MM-dd" // Format the date
                    placeholderText="Select a date"
                    className="date-picker-input"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="location">Location:</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    placeholder="Enter activity location"
                    value={formData.location}
                    onChange={handleChange}
                  />
                  <div className="map-container">
                    <MapComponent onLocationSelect={handleMapLocationSelect} />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="numberOfPlaces">Number of Places:</label>
                  <input
                    type="number"
                    id="numberOfPlaces"
                    name="numberOfPlaces"
                    placeholder="Enter number of places"
                    value={formData.numberOfPlaces}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="category">Category:</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                  >
                    <option value="">Select category</option>
                    <option value="Workshop">Workshop</option>
                    <option value="Webinar">Webinar</option>
                    <option value="Meetup">Meetup</option>
                    <option value="Training">Training</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input
                      type="checkbox"
                      name="isPaid"
                      checked={formData.isPaid}
                      onChange={handleChange}
                    />
                    Paid Activity
                  </label>
                </div>
                {formData.isPaid && (
                  <div className="form-group">
                    <label htmlFor="amount">Amount:</label>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      placeholder="Enter amount"
                      value={formData.amount}
                      onChange={handleChange}
                    />
                  </div>
                )}
                {formData.category === 'Webinar' && (
                  <div className="form-group">
                    <label htmlFor="link">Webinar Link:</label>
                    {!formData.link && (
                      <button
                        type="button"
                        className="calendly-btn"
                        onClick={() => setShowCalendlyWidget(true)}
                      >
                        Schedule with Calendly
                      </button>
                    )}
                    {formData.link && (
                      <input
                        type="url"
                        id="link"
                        name="link"
                        value={formData.link}
                        readOnly
                      />
                    )}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="image">Upload Image:</label>
                  {formData.eventImage && typeof formData.eventImage === 'string' && (
                    <div className="existing-image">
                      <img
                        src={`http://localhost:5000/uploads/${formData.eventImage}`}
                        alt="Existing Event"
                        style={{ width: '100px', height: 'auto', marginBottom: '10px' }}
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    id="eventImage"
                    name="eventImage"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
            </div>

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update Activity'}
            </button>
          </form>

          <div className="switch-auth">
            <p>
              Want to go back? <NavLink to="/activities">View Activities</NavLink>
            </p>
          </div>
        </div>
      </div>

      {/* Calendly Widget */}
      {showCalendlyWidget && (
        <div className="right-box">
          <div className="calendly-modal">
            <CalendlyWidget
              url="https://calendly.com/skillminds-team/activity-scheduling"
              onDateSelect={handleCalendlyDateSelect}
            />
            <button
              type="button"
              className="close-btn"
              onClick={() => setShowCalendlyWidget(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UpdateActivity;