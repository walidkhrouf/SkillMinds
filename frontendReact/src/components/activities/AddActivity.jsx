import React, { useState, useCallback } from 'react';
import axios from 'axios';
import MapComponent from './MapComponent';
import { useNavigate, NavLink } from 'react-router-dom';
import CalendlyWidget from './CalendlyWidget';
import DatePicker from 'react-datepicker'; // Import React Date Picker
import 'react-datepicker/dist/react-datepicker.css'; // Import CSS for the date picker
import './AddActivity.css';

const AddActivity = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: null, // Use null for React Date Picker
    numberOfPlaces: '',
    category: '',
    location: '',
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

  const validateStep = () => {
    const { title, description, date, numberOfPlaces, location, category, isPaid, amount, link } = formData;

    if (step === 1) {
      if (!title || !description || !date || numberOfPlaces === '') {
        setError('Please fill all required fields in step 1.');
        return false;
      }
    }
    if (step === 2) {
      if (!location) {
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
      setSuccess('Activity added successfully!');
      setError('');
      setFormData({
        title: '',
        description: '',
        date: null,
        numberOfPlaces: '',
        category: '',
        location: '',
        isPaid: false,
        amount: '',
        link: '',
        eventImage: null,
      });
      setTimeout(() => navigate('/activities'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the activity.');
      setSuccess('');
      if (err.response?.status === 401) {
        navigate('/signin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCalendlyDateSelect = ({ eventLink, selectedDate }) => {
    setFormData((prev) => ({
      ...prev,
      link: eventLink,
    }));
    setShowCalendlyWidget(false);
  };

  return (
    <div className="activity-container">
      <div className="activity-left-box">
        <div className="activity-auth-container">
          <h2>Add Activity</h2>
          {error && <p className="activity-error">{error}</p>}
          {success && <p className="activity-success">{success}</p>}
          <form className="activity-auth-form" onSubmit={handleSubmit}>
            {/* Step 1: Title, Description, Date, and Number of Places */}
            <div className={`activity-form-step ${step === 1 ? 'active' : ''}`}>
              <div className="activity-form-group">
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
              <div className="activity-form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  id="description"
                  name="description"
                  placeholder="Enter activity description"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
              <div className="activity-form-group">
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
              <div className="activity-form-group">
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
            </div>

            {/* Step 2: Location and Image Upload */}
            <div className={`activity-form-step ${step === 2 ? 'active' : ''}`}>
              <div className="activity-form-group">
                <label htmlFor="location">Location:</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  placeholder="Enter activity location"
                  value={formData.location}
                  onChange={handleChange}
                />
              </div>
              <div className="activity-form-group">
                <label>Map Preview:</label>
                <MapComponent onLocationSelect={handleMapLocationSelect} />
              </div>
              <div className="activity-form-group">
                <label htmlFor="image">Upload Image:</label>
                <input
                  type="file"
                  id="eventImage"
                  name="eventImage"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
            </div>

            {/* Step 3: Category, Payment, and Link */}
            <div className={`activity-form-step ${step === 3 ? 'active' : ''}`}>
              <div className="activity-form-group">
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
              <div className="activity-form-group">
                <label>Paid Activity</label>
                <input
                  type="checkbox"
                  name="isPaid"
                  checked={formData.isPaid}
                  onChange={handleChange}
                />
              </div>
              {formData.isPaid && (
                <div className="activity-form-group">
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
              {formData.category === 'Webinar' && !formData.link && (
                <div className="activity-form-group">
                  <label htmlFor="link">Webinar Link:</label>
                  <button
                    type="button"
                    className="activity-calendly-btn"
                    onClick={() => setShowCalendlyWidget(true)}
                  >
                    Schedule with Calendly
                  </button>
                </div>
              )}
              {formData.category === 'Webinar' && formData.link && (
                <div className="activity-form-group">
                  <label htmlFor="link">Webinar Link:</label>
                  <input
                    type="url"
                    id="link"
                    name="link"
                    value={formData.link}
                    readOnly
                  />
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="activity-form-navigation">
              {step > 1 && (
                <button type="button" className="activity-back-btn" onClick={handleBack}>
                  Back
                </button>
              )}
              {step < 3 ? (
                <button type="button" className="activity-auth-btn" onClick={handleNext}>
                  Next
                </button>
              ) : (
                <button type="submit" className="activity-auth-btn" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Activity'}
                </button>
              )}
            </div>
          </form>

          <div className="activity-switch-auth">
            <p>
              Want to go back? <NavLink to="/activities">View Activities</NavLink>
            </p>
          </div>
        </div>
      </div>

      <div className="activity-right-box">
        {showCalendlyWidget && (
          <div className="activity-calendly-modal">
            <CalendlyWidget
              url="https://calendly.com/skillminds-team/activity-scheduling"
              onDateSelect={handleCalendlyDateSelect}
            />
            <button
              type="button"
              className="activity-close-btn"
              onClick={() => setShowCalendlyWidget(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddActivity;