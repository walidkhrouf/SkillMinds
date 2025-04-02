import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Recruitement.css';

const JobOfferDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [skillsMap, setSkillsMap] = useState({});
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    axios.get('http://localhost:5000/api/admin/skills')
      .then(res => {
        const map = {};
        res.data.forEach(skill => {
          map[skill._id] = skill.name;
        });
        setSkillsMap(map);
      })
      .catch(err => console.error('Error fetching skills:', err));
  }, []);

  const fetchJobDetails = () => {
    axios.get(`http://localhost:5000/api/recruitment/job-offers/${jobId}`, {
      params: { userId: currentUser._id }
    })
      .then(res => {
        setJob(res.data.jobOffer);
        if (res.data.applications) setApplications(res.data.applications);
      })
      .catch(err => console.error('Error fetching job details:', err));
  };

  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  const handleDownload = (applicationId) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/api/recruitment/cv/download/${applicationId}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setError('');
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/recruitment/applications/${applicationId}/status`, { status });
      setSuccess(`Application ${status}`);
      setTimeout(() => setSuccess(''), 3000);
      fetchJobDetails();
    } catch (err) {
      console.error('Failed to update status', err);
      setError('Could not update application status');
    }
  };

  if (!job) return <p>Loading...</p>;

  const skillNames = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.map(id => skillsMap[id] || id).join(', ')
    : 'N/A';

  return (
    <div style={{ padding: '20px' }}>
      <br />
      <br />

      {/* ✅ Message stylé comme dans CreateJobOffer */}
      {success && (
        <p className={`message ${success.includes('accepted') ? 'success' : 'error'}`}>
        {success}
      </p>
      )}
      {error && <p className="message error">{error}</p>}
<br /> <br />
      <h2>{job.title}</h2>
      <p><strong>Description:</strong> {job.description}</p>
      <p><strong>Location:</strong> {job.location || 'N/A'}</p>
      <p><strong>City:</strong> {job.city || 'N/A'}</p>
      <p><strong>Experience:</strong> {job.experienceLevel}</p>
      <p><strong>Job Type:</strong> {job.jobType}</p>
      <p><strong>Salary Range:</strong> {job.salaryRange || 'N/A'}</p>
      <p><strong>Required Skills:</strong> {skillNames}</p>
      <p><strong>Posted By:</strong> {job.postedBy?.username || 'N/A'}</p>
      <p><strong>Status:</strong> {job.status  || 'N/A'}</p>



      {job.postedBy._id === currentUser._id && (
        <> <br /> 
          <h2>Applicants</h2>
          {applications.length === 0 ? (
            <p>No applications yet.</p>
          ) : (
            applications.map(app => (
              <div key={app._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                <p><strong>Applicant:</strong> {app.applicantId?.username || 'N/A'}</p>
                <p><strong>Email:</strong> {app.applicantId?.email || 'N/A'}</p>
                <p><strong>Status:</strong> {app.status}</p>
                <p><strong>Cover Letter:</strong> {app.coverLetter}</p>
                <p>
                  <strong>Resume:</strong>{' '}
                  <button
                    onClick={() => handleDownload(app.applicationId)}
                    style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                  >
                    Download CV
                  </button>
                </p>

                {app.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => handleStatusUpdate(app._id, 'accepted')}
                      style={{ backgroundColor: 'green', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px' }}
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app._id, 'rejected')}
                      style={{ backgroundColor: 'red', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '5px' }}
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </>
      )}
      <button
        onClick={() => navigate('/all-job-offers')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#6c757d',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          marginTop: '20px'
        }}
      >
        Back to Job Offers
      </button>
    </div>
  );
};

export default JobOfferDetails;
