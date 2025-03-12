import  { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const AllJobOffers = () => {
  const navigate = useNavigate();
  const [jobOffers, setJobOffers] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    axios.get('http://localhost:5000/api/recruitment/job-offers')
      .then(res => setJobOffers(res.data))
      .catch(err => console.error('Error fetching job offers:', err));
  }, []);

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/recruitment/job-offers/${id}`, {
        params: { userId: currentUser._id }
      });
      setJobOffers(prev => prev.filter(job => job._id !== id));
    } catch (err) {
      console.error('Error deleting job offer:', err);
    }
  };

  return (
    <div style={{ padding: '20px' }}> <br /> <br /> <br />
      <h1>All Job Offers</h1>
      <Link to="/create-job-offer" style={{ padding: '10px 20px', backgroundColor: '#a47f18', color: 'white', textDecoration: 'none', borderRadius: '5px', marginBottom: '20px', display: 'inline-block' }}>
        Create New Job Offer
      </Link>
      {jobOffers.length === 0 ? (
        <p>No job offers found.</p>
      ) : (
        jobOffers.map(job => (
          <div key={job._id} style={{ border: '1px solid #ccc', padding: '10px', marginBottom: '10px', borderRadius: '5px' }}>
            <h3>{job.title}</h3>
            <p><strong>Location:</strong> {job.location || 'N/A'}</p>
            <p><strong>Experience:</strong> {job.experienceLevel}</p>
            <p><strong>Posted By:</strong> {job.postedBy?.username || 'N/A'}</p>
            <Link to={`/job-details/${job._id}`} style={{ padding: '5px 10px', backgroundColor: '#a47f18', color: 'white', textDecoration: 'none', borderRadius: '5px', marginRight: '10px' }}>
              View Details
            </Link>
          

            {job.postedBy._id === currentUser._id && (
              <>
                <button onClick={() => navigate(`/edit-job-offer/${job._id}`)} style={{ padding: '5px 10px', backgroundColor: '#ffc107', color: 'black', border: 'none', borderRadius: '5px', marginRight: '10px' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(job._id)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px', marginRight: '10px' }}>
                  Delete
                </button>
                <Link to={`/apply-to-job/${job._id}`} style={{ padding: '5px 10px', backgroundColor: '#007bff', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
              Apply
            </Link>
              </>
            )}
           
          </div>
        ))
      )}
    </div>
  );
};

export default AllJobOffers;