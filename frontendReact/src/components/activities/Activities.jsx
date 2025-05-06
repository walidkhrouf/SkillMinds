import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import EventCard from './EventCard';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import axios from 'axios';
import './Activities.css';

const stripePromise = loadStripe('pk_test_51OnN2iI3dJx1TucUJIuqg8dgvnToYzSsL8ewfptjIyP1xnEpXD9I6DIDbDt3CbKyoH8DGKnH74DAjg4N5JOP3PNV00YCE0EPQk');

function Activities() {
  const [searchTerm, setSearchTerm] = useState('');
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isWaiting, setIsWaiting] = useState(false);
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem('jwtToken');

  useEffect(() => {
    const jwtToken = localStorage.getItem('jwtToken');
    if (jwtToken) {
      try {
        const payload = jwtToken.split('.')[1];
        const decodedToken = JSON.parse(atob(payload));
        setUserRole(decodedToken.role);
        setUserId(decodedToken.userId || decodedToken.id);
      } catch (error) {
        console.error('Error decoding token:', error);
      }
    } else {
      console.error('No JWT token found in localStorage');
    }
    setLoading(false);
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleRecommendActivities = async () => {
    setIsWaiting(true);

    setTimeout(async () => {
      try {
        const jwtToken = localStorage.getItem('jwtToken');
        if (!jwtToken) {
          alert("You must be logged in to get recommendations.");
          navigate('/signin');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/events/recommend', {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });

        setRecommendedActivities(response.data.recommendations);
        if (response.data.recommendations.length === 0) {
          alert("No activities available to recommend at this time.");
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        if (err.response?.status === 401) {
          alert(err.response.data.message || "Your session has expired. Please log in again.");
          localStorage.removeItem('jwtToken');
          navigate('/signin');
        } else {
          alert(err.response?.data?.message || 'Failed to fetch recommendations.');
        }
      } finally {
        setIsWaiting(false);
      }
    }, 2000);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="activities-wrapper">
      <div className="header-container">
        <div className="search-wrapper">
          <input
            type="text"
            className="search-input"
            placeholder="Search events..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <div className="button-container">
          {isLoggedIn && (
            <>
              {userRole === 'learner' && (
                <button onClick={handleRecommendActivities} className="recommend-btn">
                  {isWaiting ? 'Generating Recommendations...' : 'Recommend Activities with AI'}
                </button>
              )}
              {(userRole === 'admin' || userRole === 'mentor') && (
                <Link to="/add-activity" className="add-event-btn">
                  ADD EVENT <i className="fa fa-long-arrow-alt-right"></i>
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="filter-container">
        <button
          onClick={() => handleFilterChange('all')}
          className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
        >
          All Activities
        </button>
        <button
          onClick={() => handleFilterChange('free')}
          className={`filter-btn ${filterType === 'free' ? 'active' : ''}`}
        >
          Free Activities
        </button>
        <button
          onClick={() => handleFilterChange('paid')}
          className={`filter-btn ${filterType === 'paid' ? 'active' : ''}`}
        >
          Paid Activities
        </button>
      </div>

      <div className="cards-container">
        <Elements stripe={stripePromise}>
          <EventCard
            searchTerm={searchTerm}
            userRole={userRole}
            userId={userId}
            recommendedActivities={recommendedActivities}
            setRecommendedActivities={setRecommendedActivities}
            filterType={filterType}
          />
        </Elements>
      </div>
    </div>
  );
}

export default Activities;