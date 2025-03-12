import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const JobOfferDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    axios.get(`http://localhost:5000/api/recruitment/job-offers/${jobId}`, {
      params: { userId: currentUser._id }
    })
      .then(res => {
        setJob(res.data.jobOffer);
        if (res.data.applications) setApplications(res.data.applications);
      })
      .catch(err => console.error('Error fetching job details:', err));
  }, [jobId]);

  const handleDownload = (applicationId) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/api/recruitment/cv/download/${applicationId}`;
    link.download = ''; // Filename will be set by server
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setError('');
  };

  if (!job) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px' }}> <br /> <br />
      <h1>{job.title}</h1>
      <p><strong>Description:</strong> {job.description}</p>
      <p><strong>Location:</strong> {job.location || 'N/A'}</p>
      <p><strong>Experience:</strong> {job.experienceLevel}</p>
      <p><strong>Job Type:</strong> {job.jobType}</p>
      <p><strong>Salary Range:</strong> {job.salaryRange || 'N/A'}</p>
      <p><strong>Posted By:</strong> {job.postedBy?.username || 'N/A'}</p>

      {job.postedBy._id === currentUser._id && (
        <>
          <h2>Applicants</h2>
          {error && <p style={{ color: 'red' }}>{error}</p>}
          {applications.length === 0 ? (
            <p>No applications yet.</p>
          ) : (
            applications.map(app => (
              <div key={app._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
                <p><strong>Applicant:</strong> {app.applicantId?.username || 'N/A'}</p>
                <p><strong>Email:</strong> {app.applicantId?.email || 'N/A'}</p>
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
              </div>
            ))
          )}
        </>
      )}
      <button onClick={() => navigate('/all-job-offers')} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '5px', marginTop: '20px' }}>
        Back to Job Offers
      </button>
    </div>
  );
};

export default JobOfferDetails;