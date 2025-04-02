import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import moment from 'moment';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './Recruitement.css';

const API_KEY = '2ecfb1fc13ce4bd29e2762610ddaf983'; // OpenCage API Key
const MAX_DISTANCE = 50; // Distance maximale en km
const ALT_DISTANCE = 100; // Distance alternative en km si aucun job à moins de 50 km

const RecommendedJobs = () => {
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [nearbyOffers, setNearbyOffers] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};
  const navigate = useNavigate();

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
      const response = await fetch(`https://api.opencagedata.com/geocode/v1/json?q=${city},${country}&key=${API_KEY}&limit=1`);
      const data = await response.json();
      if (data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry;
        return [lat, lng];
      }
      return null;
    } catch (error) {
      console.error("Error fetching coordinates:", error);
      return null;
    }
  }

  // Récupération des coordonnées des jobs et filtrage
useEffect(() => {
  async function fetchCoordinates() {
    const jobsWithCoordinates = await Promise.all(
      recommendedJobs.map(async (job) => {
        if (!job.coordinates) {
          const coords = await getCoordinatesFromCity(job.city, job.location);
          if (coords) {
            return { ...job, coordinates: coords };
          }
        }
        return job;
      })
    );
    setFilteredOffers(jobsWithCoordinates);

    // Filtrer les offres proches (<= 50 km)
    const nearbyJobs = jobsWithCoordinates.filter(job => {
      if (!job.coordinates || !userLocation) return false;
      const distance = calculateDistance(
        userLocation[0], userLocation[1],
        job.coordinates[0], job.coordinates[1]
      );
      return distance <= MAX_DISTANCE;
    });

    // Si aucune offre n'est proche, récupérer la plus proche dans un rayon de 100 km
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

    // Mise à jour des offres proches
    setNearbyOffers(nearbyJobs);
  }

  if (recommendedJobs.length > 0) {
    fetchCoordinates();
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

  return (
    <div className="job-page-layout">
      <section className="job-results">
        <h1 className="section-title" style={{ textAlign: 'center', fontSize: '36px' }}>Recommended Jobs</h1>

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
              <p><strong>Description:</strong> {job.description || 'N/A'}</p>
              <h4>Status: {job.status || 'N/A'}</h4>
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
                    <Link to={`/job-details/${job._id}`}>View Details</Link>
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
