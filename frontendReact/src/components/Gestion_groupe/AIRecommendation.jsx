import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Back from "../common/back/Back";
import "./groupStyles.css";

const AIRecommendation = () => {
  const [recommendations, setRecommendations] = useState({ has: [], wantToLearn: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        navigate("/signin");
        return;
      }

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay
        const response = await axios.get("http://localhost:5000/api/groups/recommend", {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setRecommendations(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load recommendations.");
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [navigate]);

  const handleViewPosts = (groupId) => navigate(`/groups/${groupId}`);

  if (loading) {
    return (
      <section className="ai-recommendation-page">
        <div className="ai-recommendation-thinking">
          <h2>AI is Thinking...</h2>
          <div className="ai-recommendation-loader">
            <div className="ai-recommendation-dot"></div>
            <div className="ai-recommendation-dot"></div>
            <div className="ai-recommendation-dot"></div>
          </div>
          <p>Finding the best groups for your skills and learning goals!</p>
        </div>
      </section>
    );
  }

  if (error) return <p className="group-form__error">{error}</p>;

  return (
    <>
      <Back title="AI Recommended Groups" />
      <section className="group-section">
        <div className="group-container">
          {/* Section for Skills User Has */}
          <div className="ai-recommendation-section">
            <h2>Groups Matching Skills You Have</h2>
            {recommendations.has.length > 0 ? (
              <div className="group-grid">
                {recommendations.has.map((group) => (
                  <div className="group-card recommended" key={group._id}>
                    <div className="group-card__content">
                      <h1 className="group-card__title">{group.name}</h1>
                      <p className="group-card__description">{group.description}</p>
                      <span className="group-card__meta">
                        Privacy: <label>{group.privacy}</label>
                      </span>
                      <span className="group-card__meta">
                        Created By: <label>{group.createdBy.username}</label>
                      </span>
                      <span className="group-card__meta">
                        Members: <label>{group.memberCount}</label>
                      </span>
                      <span className="group-card__meta">
                        Match: <label>{(group.similarity * 100).toFixed(2)}%</label>
                      </span>
                      <div className="group-card__actions">
                        <button className="group-button" onClick={() => handleViewPosts(group._id)}>
                          View Posts
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="group-no-content">No groups match the skills you currently have.</p>
            )}
          </div>

          {/* Section for Skills User Wants to Learn */}
          <div className="ai-recommendation-section">
            <h2>Groups for Skills You Want to Learn</h2>
            {recommendations.wantToLearn.length > 0 ? (
              <div className="group-grid">
                {recommendations.wantToLearn.map((group) => (
                  <div className="group-card recommended" key={group._id}>
                    <div className="group-card__content">
                      <h1 className="group-card__title">{group.name}</h1>
                      <p className="group-card__description">{group.description}</p>
                      <span className="group-card__meta">
                        Privacy: <label>{group.privacy}</label>
                      </span>
                      <span className="group-card__meta">
                        Created By: <label>{group.createdBy.username}</label>
                      </span>
                      <span className="group-card__meta">
                        Members: <label>{group.memberCount}</label>
                      </span>
                      <span className="group-card__meta">
                        Match: <label>{(group.similarity * 100).toFixed(2)}%</label>
                      </span>
                      <div className="group-card__actions">
                        <button className="group-button" onClick={() => handleViewPosts(group._id)}>
                          View Posts
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="group-no-content">No groups match the skills you want to learn.</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

export default AIRecommendation;