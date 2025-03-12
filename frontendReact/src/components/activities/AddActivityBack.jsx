import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, NavLink } from 'react-router-dom';
import MapComponent from './MapComponent'; // Import the MapComponent
import CalendlyWidget from './CalendlyWidget'; // Import the CalendlyWidget
import DatePicker from 'react-datepicker'; // Import React Date Picker
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS for the date picker
import '../AdminDashboard/AdminDashboard.css';

const AddActivityBack = ({ onAddActivity }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: null, // Use null for React Date Picker
    location: '',
    numberOfPlaces: '',
    category: '',
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
    setFormData({
      ...formData,
      date: date,
    });
    setError('');
    setSuccess('');
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

  const handleCalendlyDateSelect = ({ eventLink, selectedDate }) => {
    setFormData((prev) => ({
      ...prev,
      link: eventLink,
    }));
    setShowCalendlyWidget(false);
  };

  const validateStep = () => {
    const { title, description, date, location, category, numberOfPlaces, isPaid, amount, link } = formData;

    if (step === 1) {
      if (!title || !description) {
        setError('Please fill all required fields in step 1.');
        return false;
      }
    }
    if (step === 2) {
      if (!date || !location || numberOfPlaces === '') {
        setError('Please fill all required fields in step 2.');
        return false;
      }
    }
    if (step === 3) {
      if (!category) {
        setError('Please select a category.');
        return false;
      }
      if (isPaid && !amount) {
        setError('Amount is required for paid activities.');
        return false;
      }
      if (category === 'Webinar' && !link) {
        setError('Link is required for webinars.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    const jwtToken = localStorage.getItem('jwtToken');
    if (!jwtToken) {
      setError('You must be logged in to create an activity.');
      navigate('/signin');
      return;
    }

    setLoading(true);
    try {
      const dataToSubmit = new FormData();
      for (const key in formData) {
        if (key === 'eventImage') {
          dataToSubmit.append('eventImage', formData.eventImage);
        } else if (key === 'date') {
          dataToSubmit.append(key, formData.date.toISOString().split('T')[0]); // Format date as YYYY-MM-DD
        } else {
          dataToSubmit.append(key, formData[key]);
        }
      }

      const response = await axios.post('http://localhost:5000/api/events', dataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${jwtToken}`,
        },
      });

      // Call the callback with the new activity
      onAddActivity(response.data);

      setSuccess('Activity added successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
      setError('');
      // Clear form data after success
      setFormData({
        title: '',
        description: '',
        date: null,
        location: '',
        numberOfPlaces: '',
        category: '',
        isPaid: false,
        amount: '',
        link: '',
        eventImage: null,
      });
      setStep(1); // Reset to step 1
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the activity.');
      setSuccess('');
      if (err.response?.status === 401) {
        navigate('/signin'); // Redirect to sign-in if token is invalid or expired
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skill-manager">
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit} className="skill-form">
        {/* Step 1: Title and Description */}
        <div className={`form-step ${step === 1 ? 'active' : ''}`}>
          <div>
            <label>Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter activity title"
              value={formData.title}
              onChange={handleChange}
            
            />
          </div>
          <div>
            <label>Description</label>
            <textarea
              name="description"
              placeholder="Enter activity description"
              value={formData.description}
              onChange={handleChange}
             
            />
          </div>
        </div>

        {/* Step 2: Date, Location, Number of Places, and Image Upload */}
        <div className={`form-step ${step === 2 ? 'active' : ''}`}>
          <div>
            <label>Date</label>
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
          <div>
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="Enter activity location"
              value={formData.location}
              onChange={handleChange}
             
            />
            <div className="map-container">
              <MapComponent onLocationSelect={handleMapLocationSelect} />
            </div>
          </div>
          <div>
            <label>Number of Places</label>
            <input
              type="number"
              name="numberOfPlaces"
              placeholder="Enter number of places"
              value={formData.numberOfPlaces}
              onChange={handleChange}
             
            />
          </div>
          <div>
            <label>Upload Image</label>
            <input
              type="file"
              name="eventImage"
              accept="image/*"
              onChange={handleImageChange}
            />
          </div>
        </div>

        {/* Step 3: Category, Payment, and Link */}
        <div className={`form-step ${step === 3 ? 'active' : ''}`}>
          <div>
            <label>Category</label>
            <select
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
          <div>
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
            <div>
              <label>Amount</label>
              <input
                type="number"
                name="amount"
                placeholder="Enter amount"
                value={formData.amount}
                onChange={handleChange}
               
              />
            </div>
          )}
          {formData.category === 'Webinar' && !formData.link && (
            <div>
              <label>Webinar Link</label>
              <button
                type="button"
                className="calendly-btn"
                onClick={() => setShowCalendlyWidget(true)}
              >
                Schedule with Calendly
              </button>
            </div>
          )}
          {formData.category === 'Webinar' && formData.link && (
            <div>
              <label>Webinar Link</label>
              <input
                type="url"
                name="link"
                value={formData.link}
                readOnly
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="form-navigation">
          {step > 1 && (
            <button type="button" className="auth-btn" onClick={handleBack}>
              Back
            </button>
          )}
          {step < 3 ? (
            <button type="button" className="auth-btn" onClick={handleNext}>
              Next
            </button>
          ) : (
            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Adding...' : 'Add Activity'}
            </button>
          )}
        </div>
      </form>

      {/* Calendly Widget */}
      {showCalendlyWidget && (
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
      )}
    </div>
  );
};

export default AddActivityBack;