import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Recruitement.css';

const CreateJobOffer = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    experienceLevel: 'Beginner',
    jobType: 'Full-Time',
    location: '',
    city: '',
    salaryRange: '',
    requiredSkills: []
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [countries, setCountries] = useState([]);
  const [cities, setCities] = useState([]);
  const [skills, setSkills] = useState([]);
  const [loadingDescription, setLoadingDescription] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  // 🇨🇦 Récupération des pays
  useEffect(() => {
    axios.get('https://restcountries.com/v3.1/all')
      .then(response => {
        const countryNames = response.data.map(country => country.name.common);
        setCountries(countryNames.sort());
      })
      .catch(error => console.error("Erreur récupération des pays :", error));
  }, []);

  // 🧠 Récupération des skills depuis backend
  useEffect(() => {
    axios.get('http://localhost:5000/api/admin/skills')
      .then(res => setSkills(res.data))
      .catch(err => console.error('Erreur récupération des skills', err));
  }, []);

  // 📍 Récupération des villes selon le pays
  const fetchCities = async (country) => {
    try {
      const response = await axios.post('http://localhost:5000/api/recruitment/cities', { country });
      if (response.data && response.data.data) {
        setCities(response.data.data);
      } else {
        setCities([]);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des villes:", error);
      setCities([]);
    }
  };

  // 🔁 Gérer changement input
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === "location") {
      setFormData(prev => ({ ...prev, city: '' }));
      fetchCities(value);
    }
  };

  // 🎯 Gérer sélection/désélection des skills
  const handleSkillToggle = (skillId) => {
    setFormData(prev => {
      const isSelected = prev.requiredSkills.includes(skillId);
      const updated = isSelected
        ? prev.requiredSkills.filter(id => id !== skillId)
        : [...prev.requiredSkills, skillId];
      return { ...prev, requiredSkills: updated };
    });
  };

  // 🔐 Soumission du formulaire
  const handleSubmit = async e => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!currentUser._id) return setError('Please log in to create a job offer');

    const titleRegex = /^[a-zA-Z\s]{8,}$/;
    if (!titleRegex.test(formData.title)) {
      return setError('Title must be at least 8 characters and contain only letters.');
    }

    
    const salaryRegex = /^[0-9]+$/;
    if (!salaryRegex.test(formData.salaryRange.trim())) {
      return setError('Salary range must contain only numbers.');
    }

    if (!formData.location || !formData.city || !formData.salaryRange) {
      return setError('All fields are required.');
    }

    if (formData.requiredSkills.length === 0) {
      return setError('Please select at least one required skill.');
    }

    setIsSubmitting(true);
    try {
      await axios.post('http://localhost:5000/api/recruitment/job-offers', {
        ...formData,
        postedBy: currentUser._id
      });
      setSuccess('Job offer created successfully!');
      setTimeout(() => {
        setIsSubmitting(false);
        navigate('/all-job-offers');
      }, 2000);
    } catch (err) {
      setError(err.response?.data.message || 'Error creating job offer');
      setIsSubmitting(false);
    }
  };

  // ✨ Génération IA de description via Cohere (via backend)
  const generateDescription = async () => {
    if (!formData.title || formData.title.length < 4) {
      return setError('Veuillez entrer un titre de poste valide.');
    }

    setLoadingDescription(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:5000/api/recruitment/generate-description', {
        title: formData.title
      });
      setFormData(prev => ({ ...prev, description: res.data.description }));
    } catch (err) {
      console.error("Erreur de génération:", err);
      setError("Erreur lors de la génération de la description.");
    } finally {
      setLoadingDescription(false);
    }
  };

  return (
    <div className="signup-container1">
      <div className="left-box1" style={{ height: '1000px', width: '80%' }}>
        <h2 style={{ textAlign: 'center' }}>Create Job Offer</h2>
        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title:</label>
            <input type="text" name="title" value={formData.title} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
            <button
              type="button"
              className="auth-btn"
              onClick={generateDescription}
              style={{ marginTop: '3px', backgroundColor: '#a47f18' ,width:'40%' }}
              disabled={loadingDescription}
            >
              {loadingDescription ? 'Generating...' : 'Generate Auto Description'}
            </button>
          </div>

          <div className="form-group">
            <label>Location (Country):</label>
            <select name="location" value={formData.location} onChange={handleChange} required>
              <option value="">Select a Country</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>City:</label>
            <select name="city" value={formData.city} onChange={handleChange} required>
              <option value="">Select a City</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Experience Level:</label>
            <select name="experienceLevel" value={formData.experienceLevel} onChange={handleChange} required>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label>Job Type:</label>
            <select name="jobType" value={formData.jobType} onChange={handleChange} required>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="Freelance">Freelance</option>
              <option value="Internship">Internship</option>
            </select>
          </div>

          <div className="form-group">
            <label>Salary:</label>
            <input type="text" name="salaryRange" value={formData.salaryRange} onChange={handleChange} required />
          </div>

          <div className="form-group">
            <label>Required Skills:</label>
            <div className="pill-skill-list">
              {skills.map(skill => (
                <button
                  key={skill._id}
                  type="button"
                  className={`pill ${formData.requiredSkills.includes(skill._id) ? 'selected' : ''}`}
                  onClick={() => handleSkillToggle(skill._id)}
                >
                  {skill.name}
                </button>
              ))}
            </div>
          </div>

          <button type="submit" className="auth-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Creating...' : 'Create'}
          </button>
        </form>
      </div>

      <div className="right-box1">
        <div className="content">
          {/* Image ou info complémentaire ici */}
        </div>
      </div>
    </div>
  );
};

export default CreateJobOffer;
