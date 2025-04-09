import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import MapComponent from './MapComponent';
import CalendlyWidget from './CalendlyWidget';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import './UpdateActivity.css';

const UpdateActivity = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: null,
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
  const [imageGenerating, setImageGenerating] = useState(false);
  const [newImageSelected, setNewImageSelected] = useState(false);

  const isWeekday = (date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

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
          title: activity.title || '',
          description: activity.description || '',
          category: activity.category || '',
          date: activity.date ? new Date(activity.date) : null,
          location: activity.location || '',
          numberOfPlaces: activity.numberOfPlaces || '',
          isPaid: activity.isPaid || false,
          amount: activity.amount || '',
          link: activity.link || '',
          eventImage: activity.eventImage || null,
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
      date,
    }));
    setError(''); 
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Event image must be a valid image file (e.g., JPG, PNG).');
        setFormData((prev) => ({ ...prev, eventImage: null }));
        setNewImageSelected(false);
      } else {
        setError('');
        setFormData((prev) => ({
          ...prev,
          eventImage: file,
        }));
        setNewImageSelected(true);
      }
    }
  };

  const handleGenerateAIImage = async () => {
    if (!formData.title) {
      setError('Please enter a title before generating an image.');
      return;
    }

    setImageGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.post(
        'http://localhost:5000/api/events/generate-image',
        {
          title: formData.title,
          prompt: `Professional digital art of: ${formData.title}. High quality, detailed, trending on artstation, vibrant colors`,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
          },
        }
      );

      const { filename, data } = response.data;
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const imageFile = new File([blob], filename, { type: 'image/png' });

      setFormData((prev) => ({
        ...prev,
        eventImage: imageFile,
      }));
      setNewImageSelected(true);
      setSuccess('AI image generated successfully!');
    } catch (err) {
      console.error('AI image generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate AI image. Please try again.');
    } finally {
      setImageGenerating(false);
    }
  };

  const handleCalendlyDateSelect = ({ eventLink }) => {
    setFormData((prev) => ({
      ...prev,
      link: eventLink,
    }));
    setShowCalendlyWidget(false);
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      return 'Title is required.';
    }
    if (formData.title.length < 3) {
      return 'Title must be at least 3 characters long.';
    }
    if (!formData.description.trim()) {
      return 'Description is required.';
    }
    if (formData.description.length < 10) {
      return 'Description must be at least 10 characters long.';
    }
    if (!formData.category) {
      return 'Please select a category.';
    }
    if (!formData.date) {
      return 'Please select a date.';
    }
    if (!formData.location.trim()) {
      return 'Location is required.';
    }
    if (formData.location.length < 3) {
      return 'Location must be at least 3 characters long.';
    }
    if (formData.numberOfPlaces && (isNaN(formData.numberOfPlaces) || formData.numberOfPlaces <= 0)) {
      return 'Number of places must be a positive integer.';
    }
    if (formData.isPaid && (!formData.amount || isNaN(formData.amount) || formData.amount <= 0)) {
      return 'Amount is required for paid activities and must be a positive number.';
    }
    return ''; 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const jwtToken = localStorage.getItem('jwtToken');
    if (!jwtToken) {
      setError('You must be logged in to update an activity.');
      navigate('/signin');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = new FormData();
      for (const key in formData) {
        if (key === 'eventImage') {
          if (formData.eventImage && typeof formData.eventImage !== 'string') {
            dataToSubmit.append('eventImage', formData.eventImage);
          }
        } else if (key === 'date') {
          dataToSubmit.append(key, formData.date.toISOString().split('T')[0]);
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
                    filterDate={isWeekday}
                    minDate={new Date()}
                    dateFormat="yyyy-MM-dd"
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
                  <label htmlFor="eventImage">Upload Image or Generate AI Image:</label>
                  {newImageSelected && formData.eventImage && (
                    <div className="image-preview">
                      <img
                        src={
                          typeof formData.eventImage === 'string'
                            ? `http://localhost:5000/uploads/${formData.eventImage}`
                            : formData.eventImage instanceof File
                            ? URL.createObjectURL(formData.eventImage)
                            : null
                        }
                        alt="Event Preview"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                      {formData.eventImage instanceof File && formData.eventImage.name && (
                        <p className="image-filename">{formData.eventImage.name}</p>
                      )}
                    </div>
                  )}
               <div className="image-input-container">
                  <input
                    type="file"
                    id="eventImage"
                    name="eventImage"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="image-upload-input"
                  />
                  <label htmlFor="eventImage" className="image-btn">
                    Upload Image
                  </label>
                  <button
                    type="button"
                    className="image-btn"
                    onClick={handleGenerateAIImage}
                    disabled={imageGenerating || !formData.title}
                  >
                    {imageGenerating ? (
                      <>
                        <span className="spinner"></span>
                        Generating...
                      </>
                    ) : (
                      'Generate AI Image'
                    )}
                  </button>
                </div>
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