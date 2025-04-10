import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import ReactPaginate from 'react-paginate';
import moment from 'moment';
import './Recruitement.css';

const AllJobOffers = () => {
  const navigate = useNavigate();
  const [jobOffers, setJobOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [uniqueCountries, setUniqueCountries] = useState([]);
  const [skillsMap, setSkillsMap] = useState({});
  const [currentPage, setCurrentPage] = useState(0);
  const jobsPerPage = 6;
  const [showFewerApplicants, setShowFewerApplicants] = useState(false);
const [showRecommended, setShowRecommended] = useState(false);
const [showOpenJobs, setShowOpenJobs] = useState(false);
const [showMyPostedJobs, setShowMyPostedJobs] = useState(false);


  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const [selectedFilter, setSelectedFilter] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [selectedDateFilter, setSelectedDateFilter] = useState('all');
  const [selectedJobTypes, setSelectedJobTypes] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);

  useEffect(() => {
    axios.get('http://localhost:5000/api/recruitment/job-offers')
      .then(res => {
        setJobOffers(res.data);
        setFilteredOffers(res.data);

        const locations = res.data.map(job => job.location?.trim()).filter(Boolean);
        const unique = [...new Set(locations)];
        setUniqueCountries(unique);
      })
      .catch(err => console.error('Error fetching job offers:', err));

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

  useEffect(() => {
    const applyFilters = () => {
      let filtered = [...jobOffers];

      if (showFewerApplicants) {
        filtered = filtered.filter(job => job.applicants?.length < 5);
      }

      if (showRecommended) {
        filtered = filtered.filter(job => job.recommended); 
      }

      if (showOpenJobs) {
        filtered = filtered.filter(job => job.status === 'open');
      }

      if (showMyPostedJobs) {
        filtered = filtered.filter(job => job.postedBy._id === currentUser._id);
      }

      if (selectedDateFilter !== 'all') {
        const daysAgo = parseInt(selectedDateFilter);
        const cutoff = moment().subtract(daysAgo, 'days');
        filtered = filtered.filter(job => moment(job.createdAt).isAfter(cutoff));
      }

      if (searchValue.trim() !== '') {
        const value = searchValue.toLowerCase();
        filtered = filtered.filter(job => {
          if (selectedFilter === 'title') return job.title.toLowerCase().includes(value);
          if (selectedFilter === 'location') return job.location?.toLowerCase().includes(value);
          if (selectedFilter === 'salary') return job.salaryRange?.toLowerCase().includes(value);
          return true;
        });
      }

      if (selectedJobTypes.length > 0) {
        filtered = filtered.filter(job => selectedJobTypes.includes(job.jobType));
      }

      if (selectedCountries.length > 0) {
        filtered = filtered.filter(job => selectedCountries.includes(job.location));
      }

      setFilteredOffers(filtered);
      setCurrentPage(0);
    };

    applyFilters();
  }, [searchValue, selectedFilter, selectedDateFilter, jobOffers, selectedJobTypes, selectedCountries, showFewerApplicants, showRecommended, showOpenJobs, showMyPostedJobs]);

  const handleCheckboxChanging = (setter) => {
    setter(prev => !prev);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/recruitment/job-offers/${id}`, {
        params: { userId: currentUser._id }
      });
      setJobOffers(prev => prev.filter(job => job._id !== id));
      setFilteredOffers(prev => prev.filter(job => job._id !== id));
    } catch (err) {
      console.error('Error deleting job offer:', err);
    }
  };

  const handleCheckboxChange = (value, type) => {
    const updateState = (state, setState) => {
      if (state.includes(value)) {
        setState(state.filter(item => item !== value));
      } else {
        setState([...state, value]);
      }
    };

    if (type === 'jobType') {
      updateState(selectedJobTypes, setSelectedJobTypes);
    } else if (type === 'country') {
      updateState(selectedCountries, setSelectedCountries);
    }
  };

  const offset = currentPage * jobsPerPage;
  const currentJobs = filteredOffers.slice(offset, offset + jobsPerPage);
  const pageCount = Math.ceil(filteredOffers.length / jobsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fonction pour changer la case et rediriger
const handleCheckboxChangingWithRedirect = (setter, redirectPath) => {
  setter(prev => !prev);
  navigate(redirectPath);
};

  


  return (
    <div className="job-page-layout">
      <aside className="job-filters">
      <h3>Filters</h3>

<label>
  <input 
    type="checkbox" 
    checked={showRecommended} 
    onChange={() => handleCheckboxChangingWithRedirect(setShowRecommended, '/recommended-jobs')} 
  /> Recommended Jobs
</label>

<label>
  <input type="checkbox" checked={showOpenJobs} onChange={() => handleCheckboxChanging(setShowOpenJobs)} /> Open Jobs
</label>
<label>
  <input type="checkbox" checked={showMyPostedJobs} onChange={() => handleCheckboxChanging(setShowMyPostedJobs)} /> My Posted Jobs
</label>


        <h3>Date Posted</h3>
        <label><input type="radio" name="date" value="all" checked={selectedDateFilter === 'all'} onChange={(e) => setSelectedDateFilter(e.target.value)} /> All</label>
        <label><input type="radio" name="date" value="30" checked={selectedDateFilter === '30'} onChange={(e) => setSelectedDateFilter(e.target.value)} /> Past 30 days</label>
        <label><input type="radio" name="date" value="7" checked={selectedDateFilter === '7'} onChange={(e) => setSelectedDateFilter(e.target.value)} /> Past 7 days</label>
        <label><input type="radio" name="date" value="1" checked={selectedDateFilter === '1'} onChange={(e) => setSelectedDateFilter(e.target.value)} /> Past 24 hours</label>

        <h3>Job Type</h3>
        {['Full-Time', 'Part-Time', 'Freelance', 'Internship'].map(type => (
          <label key={type}>
            <input type="checkbox" value={type} checked={selectedJobTypes.includes(type)} onChange={() => handleCheckboxChange(type, 'jobType')} />
            {type}
          </label>
        ))}

        <h3>Country</h3>
        {uniqueCountries.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#777' }}>No countries found</p>
        ) : (
          uniqueCountries.map((country, idx) => (
            <label key={idx}>
              <input
                type="checkbox"
                value={country}
                checked={selectedCountries.includes(country)}
                onChange={() => handleCheckboxChange(country, 'country')}
              />
              {country}
            </label>
          ))
        )}
      </aside>

      <section className="job-results"> <br /> 
        <h1 className="section-title" style={{ textAlign: 'center', fontSize: '36px' }}>All Job Offers</h1>

        <div className="top-search-bar">
          <input
            type="text"
            className="search-text"
            placeholder="Search jobs, skills, companies"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          <select className="search-select" value={selectedFilter} onChange={(e) => setSelectedFilter(e.target.value)}>
            <option value="">Select Filter</option>
            <option value="title">Title</option>
            <option value="location">Location</option>
            <option value="salary">Salary</option>
          </select>
          <button className="search-btn" onClick={() => {}} disabled={!searchValue || !selectedFilter}>Find Jobs</button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginBottom: '20px' }}>
          <Link to="/create-job-offer" className="viewmore create-button">Create New Job Offer</Link>
          <Link to="/recommended-jobs" className="viewmore create-button" style={{ background: 'rgb(78, 49, 6)' }}>Recommendation with AI</Link>
        </div>

        <p className="job-count">{filteredOffers.length} job{filteredOffers.length !== 1 ? 's' : ''} found</p>

        {filteredOffers.length === 0 ? (
          <p>No job offers found.</p>
        ) : (
          <>
            <div className="job-offer-container">
              {currentJobs.map(job => (
                <div key={job._id} className="job-card">
            <Link to={`/job-details/${job._id}`} className="job-title-link">
            <h2>{job.title}</h2>
          </Link>                 
           <div className="job-location">
                <img src="/public/images/locations.png" alt="location" />
                   <p>{job.city || 'N/A'}, {job.location || 'N/A'}</p>
                </div>
                  <p><strong>Posted By:</strong> {job.postedBy?.username || 'N/A'}</p>
                  <p><strong>Description:</strong> {job.description || 'N/A'}</p>
                  <h4>Status: {job.status || 'N/A'}</h4>

                  <div className="job-card-actions">
              <Link to={`/job-details/${job._id}`} className="viewmore">View Details</Link>

              {job.postedBy._id === currentUser._id && (
  <div className="sub-actions">
    {job.status !== 'closed' && (
      <button
        onClick={() => navigate(`/edit-job-offer/${job._id}`)}
        className="edit-button"
      >
        Edit
      </button>
    )}
    <button
      onClick={() => handleDelete(job._id)}
      className="delete-button"
    >
      Delete
    </button>
  </div>
)}


              {job.postedBy._id !== currentUser._id && job.status !== 'closed' && (
                <Link to={`/apply-to-job/${job._id}`} className="viewmore">Apply</Link>
              )}
            </div>


                  <div style={{ textAlign: 'right', color: 'green', fontWeight: 'bold' }}>
                    {moment(job.createdAt).fromNow()}
                  </div>
                </div>
              ))}
            </div>

            <ReactPaginate
              previousLabel={'<'}
              nextLabel={'>'}
              breakLabel={'...'}
              pageCount={pageCount}
              marginPagesDisplayed={1}
              pageRangeDisplayed={2}
              onPageChange={handlePageClick}
              containerClassName={'pagination'}
              activeClassName={'active'}
            />
          </>
        )}
      </section>
    </div>
  );
};

export default AllJobOffers;
