import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EditJobOffer = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    axios.get(`http://localhost:5000/api/recruitment/job-offers/${jobId}`, {
      params: { userId: currentUser._id }
    })
      .then(res => setFormData(res.data.jobOffer))
      .catch(err => setError('Error fetching job offer'));
  }, [jobId]);

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!currentUser._id) return setError('Please log in to edit');

    try {
      const response = await axios.put(`http://localhost:5000/api/recruitment/job-offers/${jobId}`, {
        ...formData,
        userId: currentUser._id
      });
      setSuccess('Job offer updated successfully!');
      setTimeout(() => navigate('/all-job-offers'), 2000);
    } catch (err) {
      setError(err.response?.data.message || 'Error updating job offer');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
      <h2>Edit Job Offer</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Title:</label>
          <input type="text" name="title" value={formData.title || ''} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        </div>
        <div>
          <label>Description:</label>
          <textarea name="description" value={formData.description || ''} onChange={handleChange} required style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        </div>
        <div>
          <label>Experience Level:</label>
          <select name="experienceLevel" value={formData.experienceLevel || 'Beginner'} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>
        <div>
          <label>Job Type:</label>
          <select name="jobType" value={formData.jobType || 'Full-Time'} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }}>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Freelance">Freelance</option>
            <option value="Internship">Internship</option>
          </select>
        </div>
        <div>
          <label>Location:</label>
          <input type="text" name="location" value={formData.location || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        </div>
        <div>
          <label>Salary Range:</label>
          <input type="text" name="salaryRange" value={formData.salaryRange || ''} onChange={handleChange} style={{ width: '100%', padding: '8px', marginBottom: '10px' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>Update</button>
      </form>
    </div>
  );
};

export default EditJobOffer;