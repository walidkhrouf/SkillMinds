import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SkillList.css";

const SkillsList = () => {
  const navigate = useNavigate();
  const [availableSkills, setAvailableSkills] = useState([]);
  const [wantsToLearn, setWantsToLearn] = useState([]);
  const [hasSkills, setHasSkills] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSkills() {
      try {
        const res = await fetch("http://localhost:5000/api/users/skills");
        if (res.ok) {
          const data = await res.json();
          setAvailableSkills(data);
        } else {
          setError("Error fetching skills");
        }
      } catch (err) {
        console.error(err);
        setError("Error fetching skills");
      }
    }
    fetchSkills();
  }, []);

  const addToWants = (skill) => {
    if (!wantsToLearn.find((s) => s._id === skill._id)) {
      setWantsToLearn([...wantsToLearn, skill]);
    }
  };

  const addToHas = (skill) => {
    if (!hasSkills.find((s) => s._id === skill._id)) {
      setHasSkills([...hasSkills, skill]);
    }
  };

  const removeFromWants = (skillId) => {
    setWantsToLearn(wantsToLearn.filter((s) => s._id !== skillId));
  };

  const removeFromHas = (skillId) => {
    setHasSkills(hasSkills.filter((s) => s._id !== skillId));
  };

  const handleNext = async () => {
    const currentUserStr = localStorage.getItem("currentUser");
    if (!currentUserStr) {
      setError("User not logged in");
      return;
    }
    const currentUser = JSON.parse(currentUserStr);
    setLoading(true);
    try {
      const finishResponse = await fetch("http://localhost:5000/api/users/finishSkills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser._id,
          selectedSkills: [
            ...wantsToLearn.map((skill) => ({
              skillId: skill._id,
              skillType: "wantsToLearn"
            })),
            ...hasSkills.map((skill) => ({
              skillId: skill._id,
              skillType: "has"
            }))
          ]
        }),
      });
      if (!finishResponse.ok) {
        const finishData = await finishResponse.json();
        setError(finishData.message || "Error finishing skill selection");
        setLoading(false);
        return;
      }
      
      const finishData = await finishResponse.json();
    
      if (finishData.user) {
        localStorage.setItem("currentUser", JSON.stringify(finishData.user));
      }
      navigate("/");
    } catch (err) {
      console.error(err);
      setError("Error saving skills");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="skills-list-container">
      <h2>Select Your Skills</h2>
      {error && <p className="error">{error}</p>}
      <div className="skills-selection">
        <div className="skills-section">
          <h3>Skills I Want to Learn</h3>
          <div className="skills-grid">
            {availableSkills.map((skill) => (
              <div key={skill._id} className="skill-card">
                <p>{skill.name}</p>
                <button onClick={() => addToWants(skill)}>Add</button>
              </div>
            ))}
          </div>
          <div className="selected-skills">
            <h4>Selected:</h4>
            {wantsToLearn.map((skill) => (
              <div key={skill._id} className="selected-skill">
                <span>{skill.name}</span>
                <button onClick={() => removeFromWants(skill._id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
        <div className="skills-section">
          <h3>Skills I Have</h3>
          <div className="skills-grid">
            {availableSkills.map((skill) => (
              <div key={skill._id} className="skill-card">
                <p>{skill.name}</p>
                <button onClick={() => addToHas(skill)}>Add</button>
              </div>
            ))}
          </div>
          <div className="selected-skills">
            <h4>Selected:</h4>
            {hasSkills.map((skill) => (
              <div key={skill._id} className="selected-skill">
                <span>{skill.name}</span>
                <button onClick={() => removeFromHas(skill._id)}>Remove</button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="next-button-container">
        <button onClick={handleNext} disabled={loading}>
          {loading ? "Saving..." : "Next"}
        </button>
      </div>
    </div>
  );
};

export default SkillsList;
