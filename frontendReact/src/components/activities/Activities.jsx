import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EventCard from './EventCard';
import './Activities.css';

function Activities() {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

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
        <Link to="/add-activity" className="add-event-btn">
          ADD EVENT <i className="fa fa-long-arrow-alt-right"></i>
        </Link>
      </div>
      <div className="cards-container">
        <EventCard searchTerm={searchTerm} />
      </div>
    </div>
  );
}

export default Activities;