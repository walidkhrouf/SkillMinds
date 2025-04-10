import { useState, useEffect } from "react";
import axios from "axios";
import "./tutorialStyles.css";

const Stat = () => {
  const [mostUsedCategory, setMostUsedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Récupérer les statistiques au chargement du composant
  useEffect(() => {
    const fetchMostUsedCategory = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/tutorials/most-used-category");
        console.log("API Response:", response.data); // Log de la réponse de l'API pour vérification
        setMostUsedCategory(response.data);
      } catch (err) {
        console.error("Error fetching statistics:", err);
        setError("Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchMostUsedCategory();
  }, []);

  return (
    <div className="stat-section">
      <h2 className="stat-title">Skill Usage Statistics</h2>

      {/* Affichage des erreurs ou du message de chargement */}
      {loading ? (
        <p>Loading statistics...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : mostUsedCategory ? (
        <div className="statistics-container">
          <div className="stat-card">
            <h3>Most Used Category</h3>
            <p><strong>Category:</strong> {mostUsedCategory.category}</p>
            <p><strong>Usage Count:</strong> {mostUsedCategory.count}</p>
          </div>
        </div>
      ) : (
        <p>No statistics available.</p> // Message de secours si les données sont vides
      )}
    </div>
  );
};

export default Stat;
