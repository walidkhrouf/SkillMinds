import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Back from "../common/back/Back";
import axios from "axios";
import "./tutorialStyles.css";

const TutorialDetail = () => {
  const { tutorialId } = useParams();
  const [tutorial, setTutorial] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    userId: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("en");
  const navigate = useNavigate();

  const userId = JSON.parse(localStorage.getItem("currentUser") || "{}")._id || "";

  useEffect(() => {
    if (!userId) {
      navigate("/signin");
      return;
    }
    const fetchTutorial = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/tutorials/${tutorialId}`);
        setTutorial(response.data.tutorial);
        setFormData({
          title: response.data.tutorial.title,
          content: response.data.tutorial.content,
          category: response.data.tutorial.category,
          userId,
        });
      } catch (err) {
        setError("Failed to load tutorial");
      } finally {
        setLoading(false);
      }
    };
    fetchTutorial();
  }, [tutorialId, userId, navigate]);

  // 🔁 Fonction de traduction SYSTRAN
  const changeLanguage = async (lang) => {
    setLanguage(lang);
    if (tutorial && tutorial.content) {
      try {
        const response = await axios.post(
          "https://api-translate.systran.net/translation/text/translate",
          {
            input: [tutorial.content],
            source: "auto", // Détection automatique de la langue source
            target: lang
          },
          {
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Key a9b3aa86-93de-4531-ab69-59e997285d3c"
            }
          }
        );

        const translatedText = response.data.outputs[0].output;

        setTutorial(prev => ({
          ...prev,
          content: translatedText
        }));
      } catch (err) {
        console.error("Erreur de traduction :", err);
        setError("Traduction échouée. Vérifiez votre connexion ou clé API.");
      }
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put(
        `http://localhost:5000/api/tutorials/${tutorialId}`,
        formData
      );
      setTutorial(response.data.tutorial);
      setIsEditing(false);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to update tutorial");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this tutorial?")) return;
    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/tutorials/${tutorialId}`, {
        data: { userId },
      });
      navigate("/tutorials");
    } catch (error) {
      setError(error.response?.data?.message || "Failed to delete tutorial");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (mediaUrl) => {
    const link = document.createElement("a");
    link.href = mediaUrl;
    link.download = mediaUrl.split("/").pop();
    link.click();
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="tutorial-detail__error">{error}</p>;
  if (!tutorial) return null;

  const isOwner = tutorial.authorId._id === userId;

  return (
    <>
      <Back title={tutorial.title} />
      <section className="tutorial-section">
        <div>
          <select
            onChange={(e) => changeLanguage(e.target.value)}
            defaultValue={language}
            className="language-selector"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ar">العربية</option>
          </select>
        </div>

        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="tutorial-form">
            <h2 className="tutorial-form__title">Edit Tutorial</h2>
            <div className="tutorial-form__field">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleEditChange}
                className="tutorial-form__input"
              />
            </div>
            <div className="tutorial-form__field">
              <label>Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleEditChange}
                className="tutorial-form__textarea"
              />
            </div>
            <div className="tutorial-form__field">
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={handleEditChange}
                className="tutorial-form__input"
              />
            </div>
            <button type="submit" disabled={loading} className="tutorial-button">
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={handleEditToggle}
              className="tutorial-button tutorial-button--secondary"
            >
              Cancel
            </button>
          </form>
        ) : (
          <div className="tutorial-detail">
            <h2 className="tutorial-detail__title">{tutorial.title}</h2>
            <p className="tutorial-detail__meta">
              By {tutorial.authorId.username} | {tutorial.category} |{" "}
              {new Date(tutorial.createdAt).toLocaleDateString()}
            </p>
            <p className="tutorial-detail__content">{tutorial.content}</p>
            {tutorial.media &&
              tutorial.media.length > 0 && (
                <div className="tutorial-detail__media">
                  {tutorial.media.map((item, index) => (
                    <div key={index} style={{ marginBottom: "10px" }}>
                      <img
                        src={item.data}
                        alt={`Tutorial media ${index}`}
                        style={{ maxWidth: "300px", margin: "10px" }}
                      />
                    </div>
                  ))}
                </div>
              )}
            {isOwner && (
              <div className="tutorial-detail__actions" style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleEditToggle} className="tutorial-button">
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="tutorial-button tutorial-button--danger"
                >
                  Delete
                </button>
                {tutorial.media && tutorial.media.length > 0 && (
                  <button
                    onClick={() => handleDownload(tutorial.media[0].data)}
                    className="tutorial-button tutorial-button--download"
                  >
                    Download
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
};

export default TutorialDetail;