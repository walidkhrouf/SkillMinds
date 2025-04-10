  import React, { useState, useEffect } from "react";
  import { FaTrash, FaEdit } from "react-icons/fa";
  import { useNavigate } from "react-router-dom";
  import EditJobOffer from "./EditJobOffer";
  import axios from "axios";
  import { Link } from 'react-router-dom'; 

  const JobOfferCard = ({ data, onDelete, onUpdate, showActions = true }) => {
    const [editingJob, setEditingJob] = useState(null);
    const [skillsMap, setSkillsMap] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
      const fetchSkills = async () => {
        try {
          const response = await axios.get("http://localhost:5000/api/recruitment/skills");
          const skillsObj = response.data.reduce((acc, skill) => {
            acc[skill._id.toString()] = skill.name;
            return acc;
          }, {});
          setSkillsMap(skillsObj);
        } catch (error) {
          console.error("Erreur lors de la récupération des compétences :", error);
        }
      };

      fetchSkills();
    }, []);

    const handleEditClick = (job) => setEditingJob(job);
    const handleSave = (updatedJob) => {
      onUpdate(updatedJob);
      setEditingJob(null);
    };
    const handleCancel = () => setEditingJob(null);
    const handleApply = (jobId) => navigate(`/apply-to-job/${jobId}`);

    return (
      <div className="job-offers-list">
        {editingJob ? (
          <EditJobOffer job={editingJob} onSave={handleSave} onCancel={handleCancel} />
        ) : (
          data.map((job) => (
            <div key={job._id} className="job-offer-card">
              <h3>{job.title}</h3>
              <p><strong>Description:</strong> {job.description}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Experience Level:</strong> {job.experienceLevel}</p>
             
           
                {/* Bouton pour postuler à une offre d'emploi */}
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
          <Link to="/apply-to-job" className="viewmore">
            Apply to a Job
          </Link>
        </div>
        <div style={{ textAlign: 'center', margin: '20px 0' }}>
        <Link to={`/job-details/${job._id}`} className="viewmore">
        Details
          </Link>
        </div>
        


            
            </div>
          ))
        )}
      </div>
    );
  };

  export default JobOfferCard;
