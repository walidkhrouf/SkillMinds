import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Recruitement.css';

const EditJobOffer = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({});
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    axios.get('https://restcountries.com/v3.1/all')
      .then(response => {
        const countryNames = response.data.map(country => country.name.common);
        setCountries(countryNames.sort());
      })
      .catch(error => console.error("Erreur récupération des pays :", error));
  }, []);

  useEffect(() => {
    axios.get(`http://localhost:5000/api/recruitment/job-offers/${jobId}`, {
      params: { userId: currentUser._id }
    })
      .then(res => {
        setFormData(res.data.jobOffer);
        if (res.data.jobOffer.location) {
          fetchCities(res.data.jobOffer.location);
        }
      })
      .catch(err => setError('Error fetching job offer'));
  }, [jobId]);

  const fetchCities = async (country) => {
    try {
      const response = await axios.post('https://countriesnow.space/api/v0.1/countries/cities', { country });
      if (response.data && response.data.data) {
        setCities(response.data.data);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des villes :", error);
      setCities([]);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "location") {
      fetchCities(value);
      setFormData(prev => ({ ...prev, location: value, city: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!currentUser._id) return setError('Please log in to edit');

    try {
      await axios.put(`http://localhost:5000/api/recruitment/job-offers/${jobId}`, {
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
    <div className="signup-container2">
      <div className="left-box2">
      <h2 className="edit-job-title">Edit Job Offer</h2>
      {error && <p className="message error">{error}</p>}
          {success && <p className="message success">{success}</p>}
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Title:</label>
              <input type="text" name="title" value={formData.title || ''} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Description:</label>
              <textarea name="description" value={formData.description || ''} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Experience Level:</label>
              <select name="experienceLevel" value={formData.experienceLevel || 'Beginner'} onChange={handleChange}>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>

            <div className="form-group">
              <label>Job Type:</label>
              <select name="jobType" value={formData.jobType || 'Full-Time'} onChange={handleChange}>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Freelance">Freelance</option>
                <option value="Internship">Internship</option>
              </select>
            </div>

            <div className="form-group">
              <label>Location (Country):</label>
              <select name="location" value={formData.location || ''} onChange={handleChange} required>
                <option value="">Select a Country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>City:</label>
              <select name="city" value={formData.city || ''} onChange={handleChange} required>
                <option value="">Select a City</option>
                {cities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Salary Range:</label>
              <input type="text" name="salaryRange" value={formData.salaryRange || ''} onChange={handleChange} />
            </div>

            <button type="submit" className="auth-btn">Update</button>
          </form>
      </div>

      <div className="right-box2">
        <div className="content">
          {/* Image de fond via CSS */}
        </div>
      </div>
    </div>
  );
};

export default EditJobOffer;
