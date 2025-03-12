import React, { useState, useEffect } from "react";
import "./Recruitement.css"; 
import Awrapper from "../about/Awrapper";
import "../about/about.css";
import JobOfferCard from "./JobOfferCard"; // Remplace JobCard
import { Link } from "react-router-dom";
import JobApplicationCard from "./JobApplicationCard";

const Recruitement = () => {
  const [latestJobs, setLatestJobs] = useState([]);

  useEffect(() => {
    // Suppression de getLatestJobOffers
    const fetchLatestJobs = async () => {
      // Simule des offres d'emploi en attendant une vraie API
      const jobs = [
        { id: 1, title: "Frontend Developer", company: "Tech Corp" },
        { id: 2, title: "Backend Engineer", company: "Innovate Ltd" },
      ];
      setLatestJobs(jobs);
    };

    fetchLatestJobs();
  }, []);

  return (
    <>
      <title>Recruitement</title>
      
      <section className='recruitement padding'>
        <div className='container'>
          <br /> <br />
          <h1 className="section-title">Latest Job Offers</h1>
          <div className="horizontal-cards">
            <JobOfferCard data={latestJobs} showActions={false} /> {/* Désactiver les icônes */}
          </div>
          <br />
          <Link to="/all-job-offers" className="viewmore">View More</Link>
        </div>
      </section>

      <Awrapper />
    </>
  );
};

export default Recruitement;
