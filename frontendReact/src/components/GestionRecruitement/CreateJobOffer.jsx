import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateJobOffer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    experienceLevel: 'Beginner',
    jobType: 'Full-Time',
    location: '',
    salaryRange: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submission flag
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submission
    if (!currentUser._id) return setError('Please log in to create a job offer');

    setIsSubmitting(true); // Set flag to true
    try {
      const response = await axios.post('http://localhost:5000/api/recruitment/job-offers', {
        ...formData,
        postedBy: currentUser._id
      });
      setSuccess('Job offer created successfully!');
      setTimeout(() => {
        setIsSubmitting(false); // Reset flag after success
        navigate('/all-job-offers');
      }, 2000);
    } catch (err) {
      setError(err.response?.data.message || 'Error creating job offer');
      setIsSubmitting(false); // Reset flag on error
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Create Job Offer</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={formData.description} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        </div>
        <div>
          <label>Experience Level:</label>
          <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label>Job Type:</label>
          <select name="jobType" value={formData.jobType} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Freelance">Freelance</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div>
          <label>Location:</label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        </div>
        <div>
          <label>Salary Range:</label>
          <input type="text" name="salaryRange" value={formData.salaryRange} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        </div>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: isSubmitting ? 'not-allowed' : 'pointer' 
          }}
        >
          {isSubmitting ? 'Creating...' : 'Create'}
        </button>
      </form>
    </div>
  );
};

export default CreateJobOffer;