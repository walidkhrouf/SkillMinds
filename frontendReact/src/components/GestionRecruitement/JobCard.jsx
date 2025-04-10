import React from 'react';

const JobCard = ({ data = [], title = 'Job Offers' }) => {
  return (
    <div className="job-card-container">
      <h1 className="section-title">{title}</h1>
      <div className="job-cards">
        {data.length === 0 ? (
          <p className="no-results">No job offers available.</p>
        ) : (
          data.map((val, index) => (
            <div className="items shadow" key={val.id || index}>
              <div className="description-box">
                <p>{val.description || 'No job description available'}</p>
              </div>
              <div className="details">
                <h2>{val.title || 'Unknown Job Title'}</h2>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default JobCard;
