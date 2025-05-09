import { useEffect, useState } from "react";

const JobApplicationCard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/job-applications") // Assure-toi que c'est bien l'URL de ton backend
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des candidatures");
        }
        return response.json();
      })
      .then((data) => {
        setApplications(data); // Stocker les candidatures récupérées
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2>Liste des Candidatures</h2>
      {loading && <p>Chargement...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {applications.map((application) => (
          <li key={application._id}>
            <strong>Candidat:</strong> {application.applicantId} <br />
            <strong>Lettre de Motivation:</strong> {application.coverLetter} <br />
            <strong>Statut:</strong> {application.status}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default JobApplicationCard;
