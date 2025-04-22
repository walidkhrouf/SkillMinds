import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AllJobApplications = () => {
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    if (currentUser._id) {
      axios.get('http://localhost:5000/api/recruitment/job-applications', {
        params: { userId: currentUser._id }
      })
        .then(res => setApplications(res.data))
        .catch(err => console.error('Error fetching applications:', err));
    }
  }, []);

  const handleDownload = (applicationId) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/api/recruitment/cv/download/${applicationId}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setError('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Your Job Applications</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {applications.length === 0 ? (
        <p>No applications found for your job offers.</p>
      ) : (
        applications.map(app => (
          <div key={app._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <p><strong>Job:</strong> {app.jobId?.title || 'N/A'}</p>
            <p><strong>Applicant:</strong> {app.applicantId?.username || 'N/A'}</p>
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
    </div>
  );
};

export default AllJobApplications;