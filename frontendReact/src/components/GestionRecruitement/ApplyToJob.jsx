import { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Recruitement.css';

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
  const [loadingLetter, setLoadingLetter] = useState(false);


  return (
    <div className="signup-container3" > <br /> 
      <div className="left-box3" style={{ height: '650px', width: '60%' }}>
        <h2 style={{ textAlign: 'center' }} className='form-title'>Apply to Job</h2>
        {error && <p className="message error">{error}</p>}
        {success && <p className="message success">{success}</p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Cover Letter:</label>
            <textarea
              value={coverLetter}
              onChange={e => setCoverLetter(e.target.value)}
              required
              style={{ width: '100%', padding: '8px', height: '100px' }}
            />
            <button
  type="button"
  
  onClick={async () => {
    if (!currentUser.username) return setError('Nom utilisateur requis pour générer la lettre');
    setLoadingLetter(true);
    try {
      const res = await axios.post('http://localhost:5000/api/recruitment/generate-cover-letter', {
        jobId: jobId, // ✅ correspond au backend
        username: currentUser.username // ✅ correspond au backend
      });
      
      setCoverLetter(res.data.coverLetter);
    } catch (err) {
      setError("Erreur génération lettre");
    } finally {
      setLoadingLetter(false);
    }
  }}
  disabled={loadingLetter}
  style={{ marginBottom: '10px', backgroundColor: '#a47f18' ,width:'40%'  }}
>
  {loadingLetter ? 'Generating...' : 'Generate Cover letter'}
</button>

          </div>

          <div className="form-group">
            <label>Resume:</label>
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              required
              style={{ marginBottom: '10px' }}
            />
          </div>

          <button
            type="submit"
            style={{ backgroundColor: '#a47f18' ,width:'auto' }} className='boutton1'
          >
            Submit
          </button>
        </form>
      </div>

      <div className="right-box3">
        <div className="content"></div>
      </div>
    </div>
  );
};

export default ApplyToJob; 