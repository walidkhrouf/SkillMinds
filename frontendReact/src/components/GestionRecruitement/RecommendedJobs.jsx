import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './Recruitement.css';
import 'leaflet/dist/leaflet.css';


const MAX_DISTANCE = 50; // Distance maximale en km
const ALT_DISTANCE = 100; // Distance alternative en km si aucun job à moins de 50 km
function getWeatherIcon(code) {
  if ([0].includes(code)) return "☀️";               // Clear sky
  if ([1, 2].includes(code)) return "🌤️";            // Partly cloudy
  if ([3].includes(code)) return "☁️";               // Overcast
  if ([45, 48].includes(code)) return "🌫️";          // Fog
  if ([51, 53, 55, 61, 63].includes(code)) return "🌦️"; // Light rain
  if ([80, 81, 82].includes(code)) return "🌧️";       // Showers
  if ([95].includes(code)) return "⛈️";              // Thunderstorm
  return "❓";
}


const RecommendedJobs = () => {
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [nearbyOffers, setNearbyOffers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const navigate = useNavigate();
  const [weatherData, setWeatherData] = useState({});


  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  });

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
      },
      () => {
        setUserLocation([34.0, 9.0]); // Default to Tunisia
      }
    );

    if (!currentUser._id) return;

    axios.get(`http://localhost:5000/api/recruitment/recommended-jobs/${currentUser._id}`)
      .then(res => {
        const filteredJobs = res.data.filter(job => job.postedBy._id !== currentUser._id);
        setRecommendedJobs(filteredJobs);
      })
      .catch(err => console.error('Error fetching recommended jobs:', err));
  }, [currentUser._id]);

  async function getCoordinatesFromCity(city, country) {
    try {
      const response = await fetch(
        `https://api.maptiler.com/geocoding/${encodeURIComponent(city + ', ' + country)}.json?key=HXejIQuQwjPLz6IguIxN`
      );
      const data = await response.json();
      if (data.features.length > 0) {
        const [lon, lat] = data.features[0].geometry.coordinates;
        return [lat, lon]; // lat d'abord car ton projet les utilise comme ça
      }
      return null;
    } catch (error) {
      console.error("Error fetching coordinates from MapTiler:", error);
      return null;
    }
  }
  
  

  // Récupération des coordonnées des jobs et filtrage
  useEffect(() => {
    setFilteredOffers(recommendedJobs); // Affiche direct
  
    async function fetchCoordinates() {
      const jobsWithCoordinates = await Promise.all(
        recommendedJobs.map(async (job) => {
          if (!job.coordinates) {
            const coords = await getCoordinatesFromCity(job.city, job.location);
            if (coords) {
              await getWeather(coords[0], coords[1], job._id); // appel météo
              return { ...job, coordinates: coords };
            }
          } else {
            await getWeather(job.coordinates[0], job.coordinates[1], job._id); // fallback
          }
          
          return job;
        })
      );
  
      const nearbyJobs = jobsWithCoordinates.filter(job => {
        if (!job.coordinates || !userLocation) return false;
        const distance = calculateDistance(
          userLocation[0], userLocation[1],
          job.coordinates[0], job.coordinates[1]
        );
        return distance <= MAX_DISTANCE;
      });
  
      if (nearbyJobs.length === 0) {
        let closestJob = null;
        let minDistance = Infinity;
  
        jobsWithCoordinates.forEach(job => {
          if (job.coordinates) {
            const distance = calculateDistance(
              userLocation[0], userLocation[1],
              job.coordinates[0], job.coordinates[1]
            );
            if (distance < minDistance) {
              closestJob = job;
              minDistance = distance;
            }
          }
        });
  
        if (closestJob) {
          nearbyJobs.push(closestJob);
        }
      }
  
      setNearbyOffers(nearbyJobs);
    }
  
    if (recommendedJobs.length > 0 && userLocation) {
      fetchCoordinates(); // Map seulement
    }
  }, [recommendedJobs, userLocation]);
  


  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // États pour la recherche
const [searchValue, setSearchValue] = useState('');
const [selectedFilter, setSelectedFilter] = useState('');

// Fonction pour gérer le changement de la valeur de recherche
const handleSearchChange = (e) => {
  setSearchValue(e.target.value);
  applyFilters();
};

const handleFilterChange = (e) => {
  setSelectedFilter(e.target.value);
  applyFilters();
};

const [selectedDateFilter, setSelectedDateFilter] = useState('all');
const [selectedJobTypes, setSelectedJobTypes] = useState([]);
const [selectedCountries, setSelectedCountries] = useState([]);
const [uniqueCountries, setUniqueCountries] = useState([]);
useEffect(() => {
  axios.get('http://localhost:5000/api/admin/skills')
    .then(res => {
      const unique = [...new Set(res.data.map(skill => skill.location))];
      setUniqueCountries(unique);
    })
    .catch(err => console.error('Error fetching skills:', err));
}, []);
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
const handleCheckboxChanging = (setter) => {
  setter((prev) => !prev);
};


const applyFilters = () => {
  let filtered = [...recommendedJobs];

  if (showFewerApplicants) {
    filtered = filtered.filter(job => job.applicants?.length < 5);
  }

  if (showRecommended) {
    filtered = filtered.filter(job => job.recommended); 
  }

  // Filtre des jobs ouverts
  if (showOpenJobs) {
    filtered = filtered.filter(job => job.status === 'open');
  }

  // Filtre des jobs postés par l'utilisateur
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
      return false;
    });
  }

  if (selectedJobTypes.length > 0) {
    filtered = filtered.filter(job => selectedJobTypes.includes(job.jobType));
  }

  if (selectedCountries.length > 0) {
    filtered = filtered.filter(job => selectedCountries.includes(job.location));
  }

  setFilteredOffers(filtered);
};

useEffect(() => {
  applyFilters();
}, [searchValue, selectedFilter, selectedDateFilter, selectedJobTypes, selectedCountries]);


useEffect(() => {
  axios.get('http://localhost:5000/api/recruitment/job-offers')
    .then(res => {
      const locations = res.data.map(job => job.location?.trim()).filter(Boolean);
      const unique = [...new Set(locations)];
      setUniqueCountries(unique);
    })
    .catch(err => console.error('Error fetching job offers:', err));
}, []);
const [showFewerApplicants, setShowFewerApplicants] = useState(false);
const [showRecommended, setShowRecommended] = useState(false);
const [showOpenJobs, setShowOpenJobs] = useState(false);
const [showMyPostedJobs, setShowMyPostedJobs] = useState(false);

useEffect(() => {
  applyFilters();
}, [searchValue, selectedFilter, selectedDateFilter, selectedJobTypes, selectedCountries, showOpenJobs, showMyPostedJobs]);

async function getWeather(lat, lon, jobId) {
  try {
    const response = await axios.get(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
    setWeatherData(prev => ({ ...prev, [jobId]: response.data.current_weather }));
  } catch (err) {
    console.error('Error fetching weather:', err);
  }
}

  return (
    <div className="job-page-layout">
      <aside className="job-filters">
  <h3>Filters</h3>
  
  <label>
  <input 
    type="checkbox" 
    checked={showRecommended} 
    onChange={() => setShowRecommended(prev => !prev)} 
  /> Recommended Jobs
</label>

<label>
  <input 
    type="checkbox" 
    checked={showOpenJobs} 
    onChange={() => handleCheckboxChanging(setShowOpenJobs)} 
  /> Open Jobs
</label>
<label>
  <input 
    type="checkbox" 
    checked={showMyPostedJobs} 
    onChange={() => handleCheckboxChanging(setShowMyPostedJobs)} 
  /> My Posted Jobs
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

      <section className="job-results">
        <h1 className="section-title" style={{ textAlign: 'center', fontSize: '36px' }}>Recommended Jobs</h1>
        <div className="job-offer-intro">
  <div className="job-offer-text">
    <h2>Find the job<br /><span>made for you</span></h2>
  </div>
  <div className="job-offer-image">
    <img src="/images/recommnded.png" alt="Job illustration" />
  </div>
</div>

        <div className="top-search-bar">
  <input
    type="text"
    className="search-text"
    placeholder="Search jobs, skills, companies"
    value={searchValue}
    onChange={handleSearchChange}
  />
  <select
    className="search-select"
    value={selectedFilter}
    onChange={handleFilterChange}
  >
    <option value="">Select Filter</option>
    <option value="title">Title</option>
    <option value="location">Location</option>
    <option value="salary">Salary</option>
  </select>
  <button
    className="search-btn"
    onClick={() => {}}
    disabled={!searchValue || !selectedFilter}
  >
    Find Jobs

  </button>
  

</div>

<p className="job-count">
  {filteredOffers.length} job{filteredOffers.length !== 1 ? 's' : ''} found
</p>
 

        <div className="job-offer-container">

          {filteredOffers.map(job => (
            <div key={job._id} className="job-card">
              <Link to={`/job-details/${job._id}`} className="job-title-link">
                <h2>{job.title}</h2>
              </Link>
              <div className="job-location">
                
                <img src="/public/images/locations.png" alt="location" />
                <p>{job.city || 'N/A'}, {job.location || 'N/A'}</p>
      

              </div>
              <p><strong>Posted By:</strong> {job.postedBy?.username || 'N/A'}</p>
<p className="job-description1"><strong>Description:</strong> {job.description || 'N/A'}</p>
              <h4>Status: {job.status || 'N/A'}</h4>
              <div className="job-card-actions">
      <Link to={`/job-details/${job._id}`} className="viewmore">View Details</Link>

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

        {userLocation && (
          <div className="map-container" style={{ height: '400px', marginTop: '20px' }}>

            <MapContainer center={userLocation} zoom={10} style={{ height: '100%', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={userLocation}>
                <Popup>You are here</Popup>
              </Marker>
              {nearbyOffers.map(job => (
                <Marker key={job._id} position={job.coordinates}>
                  <Popup>
                    <h3>{job.title}</h3>
                    <p>{job.city}, {job.location}</p>
                    {weatherData[job._id] && (
  <div className="weather-right" style={{ fontWeight: 'bold' ,fontSize: '15px'}}>
    {getWeatherIcon(weatherData[job._id].weathercode)} {weatherData[job._id].temperature}°C
  </div>
)} <br /> 
                    <Link to={`/job-details/${job._id}`}>View Details</Link> <br /> <br />
                    <Link to={`/apply-to-job/${job._id}`} >Apply</Link>


                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </section>
    </div>
  );
};

export default RecommendedJobs;
