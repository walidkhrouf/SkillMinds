import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Back from "../common/back/Back";
import "./groupStyles.css";

const EditGroup = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState({ name: "", description: "", privacy: "public", skillId: "" });
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  useEffect(() => {
    const fetchData = async () => {
      const jwtToken = localStorage.getItem("jwtToken");
      if (!jwtToken) {
        navigate("/signin");
        return;
      }
      try {
        // Fetch group data
        const groupResponse = await axios.get(`http://localhost:5000/api/groups/all`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        const groupData = groupResponse.data.find((g) => g._id === groupId);
        if (!groupData) {
          throw new Error("Group not found");
        }
        setGroup({
          name: groupData.name,
          description: groupData.description,
          privacy: groupData.privacy,
          skillId: groupData.skillId || "",
        });

        // Fetch skills
        const skillsResponse = await axios.get(`http://localhost:5000/api/admin/skills`, {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setSkills(skillsResponse.data);

        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load data.");
        setLoading(false);
        if (err.response?.status === 401) navigate("/signin");
      }
    };
    fetchData();
  }, [groupId, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const jwtToken = localStorage.getItem("jwtToken");
    try {
      const response = await axios.put(
        `http://localhost:5000/api/groups/${groupId}`,
        group,
        { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      setToastMessage(response.data.message);
      setTimeout(() => navigate("/groups"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update group.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setGroup((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <p>Loading group...</p>;
  if (error) return <p className="group-form__error">{error}</p>;

  return (
    <>
      <Back title="Edit Group" />
      <section className="group-section">
        <div className="group-container">
          <div className="group-form__wrapper">
            <h2 className="group-form__title">Edit Your Group</h2>
            <form onSubmit={handleSubmit} className="group-form">
              <div className="group-form__group">
                <label htmlFor="name">Group Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={group.name}
                  onChange={handleChange}
                  required
                  maxLength="100"
                  placeholder="Enter group name"
                />
              </div>
              <div className="group-form__group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={group.description}
                  onChange={handleChange}
                  required
                  maxLength="500"
                  placeholder="Describe your group"
                  rows="4"
                />
              </div>
              <div className="group-form__group">
                <label htmlFor="privacy">Privacy</label>
                <select
                  id="privacy"
                  name="privacy"
                  value={group.privacy}
                  onChange={handleChange}
                  required
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="group-form__group">
                <label htmlFor="skillId">Related Skill (optional)</label>
                <select
                  id="skillId"
                  name="skillId"
                  value={group.skillId}
                  onChange={handleChange}
                >
                  <option value="">None</option>
                  {skills.map((skill) => (
                    <option key={skill._id} value={skill._id}>
                      {skill.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="group-form__actions">
                <button type="submit" className="group-button group-button--submit">
                  Save Changes
                </button>
                <button
                  type="button"
                  className="group-button group-button--cancel"
                  onClick={() => navigate("/groups")}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      {toastMessage && <div className="toast-message">{toastMessage}</div>}
    </>
  );
};

export default EditGroup;  