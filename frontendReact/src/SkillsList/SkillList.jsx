import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./SkillList.css";

const SkillsList = () => {
  const navigate = useNavigate();
  const [availableSkills, setAvailableSkills] = useState([]);
  const [wantsToLearn, setWantsToLearn] = useState([]); // Selected skills for "wantsToLearn"
  const [hasSkills, setHasSkills] = useState([]);         // Selected skills for "has"
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch all available skills on mount
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

  // Toggle selection for a given skill in a specific category
  const toggleSkill = (skill, type) => {
    if (type === "wantsToLearn") {
      if (wantsToLearn.find((s) => s._id === skill._id)) {
        setWantsToLearn(wantsToLearn.filter((s) => s._id !== skill._id));
      } else {
        setWantsToLearn([...wantsToLearn, skill]);
      }
    } else if (type === "has") {
      if (hasSkills.find((s) => s._id === skill._id)) {
        setHasSkills(hasSkills.filter((s) => s._id !== skill._id));
      } else {
        setHasSkills([...hasSkills, skill]);
      }
    }
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
            <h3>Select Skills I Want to Learn</h3>
            <ul className="skills-pill-list">
              {availableSkills.map((skill) => (
                  <li
                      key={skill._id}
                      className={`skill-pill ${wantsToLearn.find(s => s._id === skill._id) ? "selected" : ""}`}
                      onClick={() => toggleSkill(skill, "wantsToLearn")}
                  >
                    {skill.name}
                  </li>
              ))}
            </ul>
          </div>
          <div className="skills-section">
            <h3>Select Skills I Have</h3>
            <ul className="skills-pill-list">
              {availableSkills.map((skill) => (
                  <li
                      key={skill._id}
                      className={`skill-pill ${hasSkills.find(s => s._id === skill._id) ? "selected" : ""}`}
                      onClick={() => toggleSkill(skill, "has")}
                  >
                    {skill.name}
                  </li>
              ))}
            </ul>
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
