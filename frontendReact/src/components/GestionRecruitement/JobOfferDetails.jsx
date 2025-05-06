import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import './Recruitement.css';
import PickInterviewDate from './PickInterviewDate';
import moment from 'moment';



  const JobOfferDetails = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [skillsMap, setSkillsMap] = useState({});
  const [currencySymbol, setCurrencySymbol] = useState('');
  const [showApplicants, setShowApplicants] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState('');
  const [showFullCoverLetter, setShowFullCoverLetter] = useState(false);
  
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

  useEffect(() => {
    if (job?.location) {
      axios.get(`https://restcountries.com/v3.1/name/${job.location}`)
        .then(res => {
          const currencies = res.data[0]?.currencies;
          if (currencies) {
            const firstKey = Object.keys(currencies)[0];
            const symbol = currencies[firstKey]?.symbol || '';
            setCurrencySymbol(symbol);
          }
        })
        .catch(err => console.error('Currency fetch error:', err));
    }
  }, [job]);

  const handleDownload = (applicationId) => {
    const link = document.createElement('a');
    link.href = `http://localhost:5000/api/recruitment/cv/download/${applicationId}`;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      await axios.put(`http://localhost:5000/api/recruitment/applications/${applicationId}/status`, { status });
      setSuccess(`Application ${status}`);
      setTimeout(() => setSuccess(''), 3000);
      fetchJobDetails();
    } catch (err) {
      setError('Could not update application status');
    }
  };

  const handleFinalDecision = async (applicationId, decision) => {
    try {
      await axios.put(`http://localhost:5000/api/recruitment/applications/${applicationId}/final-decision`, { decision });
      setSuccess(`Candidate ${decision}`);
      setTimeout(() => setSuccess(''), 3000);
      fetchJobDetails();
    } catch (err) {
      setError('Error submitting final decision');
    }
  };

  if (!job) return <p>Loading...</p>;

  const skillNames = Array.isArray(job.requiredSkills)
    ? job.requiredSkills.map(id => skillsMap[id] || id).join(', ')
    : 'N/A';

  return (
    <div className={`job-details-page ${showApplicants ? 'split-view' : 'center-view'}`}>
      <div className="left-box-details">
<br />
        <h2 style={{ textAlign: 'center' }}>{job.title}</h2>
        {success && <p className="message success">{success}</p>}
        {error && <p className="message error">{error}</p>}
        <div style={{ whiteSpace: 'pre-line' }}>
  <strong>Description:</strong> <br />
  <p>{job.description.split('##')[1] ? '##' + job.description.split('##')[1] : job.description}</p>
  <button onClick={() => setShowFullDescription(true)} className="view-more-btn">View More</button>
</div>
<br />

        <p><strong>Location:</strong> {job.location}</p>
        <p><strong>City:</strong> {job.city}</p>
        <p><strong>Experience:</strong> {job.experienceLevel}</p>
        <p><strong>Job Type:</strong> {job.jobType}</p>
        <p><strong>Salary:</strong> {job.salaryRange} {currencySymbol}</p>
        <p><strong>Required Skills:</strong> {skillNames}</p>
        <p><strong>Posted By:</strong> {job.postedBy?.username}</p>
        <p><strong>Status:</strong> {job.status}</p>

        <div className="button-row">
          <button onClick={() => navigate('/all-job-offers')} className="auth-btn">
            Back to Job Offers
          </button>
          <button onClick={() => setShowApplicants(!showApplicants)} className="auth-btn">
            {showApplicants ? 'Hide Applicants' : 'View Applicants'}
          </button>
        </div>
      </div>

      {showApplicants && (
        <div className="right-box-applicants">
          <br /><br />
          <h2 style={{ textAlign: 'center' }}>Applicants</h2>
          {job.postedBy._id === currentUser._id ? (
            applications.length === 0 ? (
              <p>No applications yet.</p>
            ) : (
              applications.map(app => (
                <div key={app._id} className="applicant-card">
                  <p><strong>Applicant:</strong> {app.applicantId?.username}</p>
                  <p><strong>Email:</strong> {app.applicantId?.email}</p>
                  <p><strong>Status:</strong> {app.status}</p>
                  <p>
  <strong>Cover Letter:</strong>{' '}
  {app.coverLetter?.length > 200
    ? (
      <>
        {app.coverLetter.slice(0, 200)}...
        <button
          className="view-more-btn"
          onClick={() => {
            setSelectedCoverLetter(app.coverLetter);
            setShowFullCoverLetter(true);
          }}
        >
          View More
        </button>
      </>
    )
    : app.coverLetter}
</p>
                  <p><strong>Resume:</strong></p>
                  <button className="button download" onClick={() => handleDownload(app.applicationId)}>
                    Download CV
                  </button>

                  {app.status === 'pending' && (
                    <div className="button-group">
                      <button className="button accept" onClick={() => handleStatusUpdate(app._id, 'accepted')}>
                        Accept for Interview
                      </button>
                      <button className="button reject" onClick={() => handleStatusUpdate(app._id, 'rejected')}>
                        Reject
                      </button>
                    </div>
                  )}

                  {app.status === 'accepted' && (
                    <div style={{ marginTop: '15px' }}>
                      {app.interviewDate ? (
                        <>
                          <p>
                            <strong>Interview Date:</strong>{' '}
                            {moment(app.interviewDate).format('dddd, MMMM D, YYYY [at] HH:mm')}
                          </p>
                          <p>
                            <strong>Meet Link:</strong>{' '}
                            <a href={app.meetLink || '#'} target="_blank" rel="noopener noreferrer">
                              {app.meetLink || 'Not provided'}
                            </a>
                          </p>
                        </>
                      ) : (
                        <PickInterviewDate applicationId={app._id} />
                      )}
                      <br />
                      {app.confirmedInterview === 'pending' && (
                        <p style={{ color: '#ff9800', fontWeight: 'bold' }}>⏳ Waiting for candidate confirmation...</p>
                      )}
                      {app.confirmedInterview === 'confirmed' && (
                        <>
                          <p style={{ color: 'green', fontWeight: 'bold' }}>✅ Confirmed by candidate</p>
                          <div className="button-group">
                            <button className="button accept" onClick={() => handleFinalDecision(app._id, 'hired')}>
                              Hire
                            </button>
                            <button className="button reject" onClick={() => handleFinalDecision(app._id, 'rejected')}>
                              Final Reject
                            </button>
                          </div>
                        </>
                      )}
                      {app.confirmedInterview === 'declined' && (
                        <p style={{ color: 'red', fontWeight: 'bold' }}>❌ Cancelled by candidate</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )
          ) : (
            <p>You are not the job poster.</p>
          )}
        </div>
      )}
    {showFullDescription && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3 style={{ textAlign: 'center' }}>Full Description</h3>

      <div className="modal-body-scrollable">
        <div style={{ whiteSpace: 'pre-line' }}>{job.description}</div>
      </div>
<br /> <br />
<div className="modal-footer-centered">
  <button className="close-btn1" onClick={() => setShowFullDescription(false)}>Close</button>
</div>
    </div>
  </div>
)}
{showFullCoverLetter && (
  <div className="modal-overlay">
    <div className="modal-content">
      <h3 style={{ textAlign: 'center' }}>Cover Letter</h3>

      <div className="modal-body-scrollable">
        <div style={{ whiteSpace: 'pre-line' }}>{selectedCoverLetter}</div>
      </div>

      <div className="modal-footer">
        <button className="close-btn" onClick={() => setShowFullCoverLetter(false)}>Close</button>
      </div>
    </div>
  </div>
)}


    </div>
    
  );
};

export default JobOfferDetails;  