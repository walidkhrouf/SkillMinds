import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, NavLink } from 'react-router-dom';
import './AddActivity.css';

const AddActivity = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    location: '',
    isPaid: false,
    amount: '',
    link: '',
    eventImage: null // Combine eventImage into formData
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
    setError('');
    setSuccess('');
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Event image must be a valid image file (e.g., JPG, PNG).");
        setFormData(prev => ({ ...prev, eventImage: null }));
      } else {
        setError('');
        setFormData(prev => ({
          ...prev,
          eventImage: file // Directly set the file
        }));
      }
    }
  };

  const validateStep = () => {
    const { title, description, date, location, category, isPaid, amount, link } = formData;
    
    if (step === 1) {
      if (!title || !description) {
        setError("Please fill all required fields in step 1.");
        return false;
      }
    }
    if (step === 2) {
      if (!date || !location) {
        setError("Please fill all required fields in step 2.");
        return false;
      }
    }
    if (step === 3) {
      if (!category) {
        setError("Please select a category.");
        return false;
      }
      if (isPaid && !amount) {
        setError("Amount is required for paid activities.");
        return false;
      }
      if (category === 'Webinar' && !link) {
        setError("Link is required for webinars.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    setLoading(true);
    try {
      const dataToSubmit = new FormData();
      for (const key in formData) {
        if (key === 'eventImage') {
          dataToSubmit.append("eventImage", formData.eventImage);
        } else {
          dataToSubmit.append(key, formData[key]);
        }
      }

      const response = await axios.post('http://localhost:5000/api/events', dataToSubmit, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Activity added successfully!');
      setError('');
      // Clear form data after success
      setFormData({
        title: '',
        description: '',
        category: '',
        date: '',
        location: '',
        isPaid: false,
        amount: '',
        link: '',
        eventImage: null
      });
      setTimeout(() => navigate('/activities'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while adding the activity.');
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-activity-container">
      <div className="left-box">
        <div className="auth-container">
          <h2>Add Activity</h2>
          {error && <p className="error">{error}</p>}
          {success && <p className="success">{success}</p>}
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Step 1: Title and Description */}
            <div className={`form-step ${step === 1 ? "active" : ""}`}>
              <div className="form-group">
                <label htmlFor="title">Title:</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="Enter activity title"
                  value={formData.title}
                  onChange={handleChange}
                  required
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
                  required
                />
              </div>
            </div>

            {/* Step 2: Date, Location, and Image Upload */}
            <div className={`form-step ${step === 2 ? "active" : ""}`}>
              <div className="form-group">
                <label htmlFor="date">Date:</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
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
              </div>
              <div className="form-group">
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
            <div className={`form-step ${step === 3 ? "active" : ""}`}>
              <div className="form-group">
                <label htmlFor="category">Category:</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
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
                    required={formData.isPaid}
                  />
                </div>
              )}
              {formData.category === 'Webinar' && (
                <div className="form-group">
                  <label htmlFor="link">Link:</label>
                  <input
                    type="url"
                    id="link"
                    name="link"
                    placeholder="Enter webinar link"
                    value={formData.link}
                    onChange={handleChange}
                    required={formData.category === 'Webinar'}
                  />
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="form-navigation">
              {step > 1 && (
                <button type="button" className="back-btn" onClick={handleBack}>
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

          <div className="switch-auth">
            <p>
              Want to go back? <NavLink to="/activities">View Activities</NavLink>
            </p>
          </div>
        </div>
      </div>

      <div className="right-box">
        <div className="content">
          <h1>Welcome to SkillMinds</h1>
        </div>
      </div>
    </div>
  );
};

export default AddActivity;