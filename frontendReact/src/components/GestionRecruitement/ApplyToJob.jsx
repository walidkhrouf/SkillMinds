import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const ApplyToJob = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [coverLetter, setCoverLetter] = useState('');
  const [resume, setResume] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  const handleFileChange = e => {
    const file = e.target.files[0];
    if (file && !['pdf', 'doc', 'docx'].includes(file.name.split('.').pop().toLowerCase())) {
      setError('File must be PDF, DOC, or DOCX');
      setResume(null);
    } else {
      setError('');
      setResume(file);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!currentUser._id) return setError('Please log in to apply');
    if (!coverLetter) return setError('Cover letter is required');
    if (!resume) return setError('Resume is required');

    const formData = new FormData();
    formData.append('applicantId', currentUser._id);
    formData.append('coverLetter', coverLetter);
    formData.append('jobId', jobId);
    formData.append('resume', resume);

    try {
      await axios.post('http://localhost:5000/api/recruitment/job-applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Application submitted successfully!');
      setTimeout(() => navigate('/all-job-offers'), 2000);
    } catch (err) {
      setError(err.response?.data.message || 'Error submitting application');
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}> <br />
      <h2>Apply to Job</h2> <br /> 
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {success && <p style={{ color: 'green' }}>{success}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Cover Letter:</label>
          <textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} required style={{ width: '100%', padding: '8px', marginBottom: '10px', height: '100px' }} />
        </div>
        <div>
          <label>Resume:</label>
          <input type="file" onChange={handleFileChange} accept=".pdf,.doc,.docx" required style={{ marginBottom: '10px' }} />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#a47f18', color: 'white', border: 'none', borderRadius: '5px' }}>Submit</button>
      </form>
    </div>
  );
};

export default ApplyToJob;