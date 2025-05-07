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
    userId: "",
    media: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [language, setLanguage] = useState("en");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const userId = JSON.parse(localStorage.getItem("currentUser") || "{}")._id || "";

  useEffect(() => {
    if (!userId) {
      navigate("/signin");
      return;
    }

    // Fetch categories
    const fetchCategories = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/skills");
        setCategories(response.data);
      } catch (err) {
        console.error("Failed to load categories");
      }
    };

    // Fetch tutorial details
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
          media: response.data.tutorial.media || []
        });
      } catch (err) {
        setError("Failed to load tutorial");
      } finally {
        setLoading(false);
      }
    };

    fetchTutorial();
    fetchCategories();
  }, [tutorialId, userId, navigate]);

  const changeLanguage = async (lang) => {
    setLanguage(lang);
    if (tutorial && tutorial.content) {
      try {
        const response = await axios.post(
            "https://api-translate.systran.net/translation/text/translate",
            {
              input: [tutorial.content],
              source: "auto",
              target: lang,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "Authorization": "Key a9b3aa86-93de-4531-ab69-59e997285d3c",
              },
            }
        );
        const translatedText = response.data.outputs[0].output;
        setTutorial((prev) => ({
          ...prev,
          content: translatedText,
        }));
      } catch (err) {
        console.error("Erreur de traduction :", err);
        setError("Traduction échouée. Vérifiez votre connexion ou clé API.");
      }
    }
  };

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve({
          name: file.name,
          type: file.type,
          data: e.target.result
        });
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(newFiles => {
      setMediaFiles(newFiles);
      setFormData(prev => ({...prev, media: [...(prev.media || []), ...newFiles]}));
    });
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
      await axios.delete(`http://localhost:5000/api/tutorials/${tutorialId}`, { data: { userId } });
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
    link.download = mediaUrl.split("/").pop() || "media_file";
    link.click();
  };

  if (loading) return <p className="loading-text">Loading...</p>;
  if (error) return <p className="tutorial-detail__error">{error}</p>;
  if (!tutorial) return null;

  const isOwner = tutorial.authorId._id === userId;

  return (
      <>
        <Back title={tutorial.title} />
        <section className="tutorial-detail">
          {!isEditing ? (
              <div className="detail-container">
                <aside className="detail-media">
                  {tutorial.media && tutorial.media.map((item, index) => (
                      <img
                          key={index}
                          src={item.data}
                          alt={`Tutorial media ${index + 1}`}
                      />
                  ))}
                </aside>
                <article className="detail-content">
                  <h1 className="detail-title">{tutorial.title}</h1>
                  <div className="detail-meta">
                    <span className="badge">{tutorial.category}</span>
                    <span>By {tutorial.authorId.username}</span>
                    <time>{new Date(tutorial.createdAt).toLocaleDateString()}</time>
                  </div>
                  <p className="detail-text">{tutorial.content}</p>
                  {isOwner && (
                      <div className="detail-actions">
                        <button onClick={handleEditToggle} className="tutorial-button tutorial-button--primary">
                          Edit
                        </button>
                        <button onClick={handleDelete} className="tutorial-button tutorial-button--danger">
                          Delete
                        </button>
                      </div>
                  )}
                  <div className="language-container">
                    <select
                        onChange={(e) => changeLanguage(e.target.value)}
                        value={language}
                        className="language-selector enhanced"
                    >
                      <option value="en">English</option>
                      <option value="fr">Français</option>
                      <option value="ar">العربية</option>
                    </select>
                  </div>
                </article>
              </div>
          ) : (
              <form onSubmit={handleEditSubmit} className="tutorial-form enhanced">
                <h2 className="tutorial-detail__title">Edit Your Tutorial</h2>
                {error && <p className="tutorial-detail__error">{error}</p>}

                <div className="tutorial-form__field">
                  <label className="tutorial-form__label">Title</label>
                  <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleEditChange}
                      className="tutorial-form__input"
                      placeholder="Enter tutorial title"
                  />
                </div>

                <div className="tutorial-form__field">
                  <label className="tutorial-form__label">Content</label>
                  <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleEditChange}
                      className="tutorial-form__textarea"
                      placeholder="Write your tutorial content here"
                      rows={10}
                  />
                </div>

                <div className="tutorial-form__field">
                  <label className="tutorial-form__label">Category</label>
                  <select
                      name="category"
                      value={formData.category}
                      onChange={handleEditChange}
                      className="tutorial-form__select"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                        <option key={category._id} value={category.name}>
                          {category.name}
                        </option>
                    ))}
                  </select>
                </div>

                <div className="tutorial-form__field">
                  <label className="tutorial-form__label">Media Files</label>
                  <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="tutorial-form__file-input"
                  />

                  {tutorial.media && tutorial.media.length > 0 && (
                      <div className="tutorial-form__media-preview">
                        <p className="media-preview-label">Current Media:</p>
                        <div className="media-preview-items">
                          {tutorial.media.map((item, index) => (
                              <div key={index} className="media-preview-item">
                                <img src={item.data} alt={`Current media ${index + 1}`} />
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {mediaFiles.length > 0 && (
                      <div className="tutorial-form__media-preview">
                        <p className="media-preview-label">New Media:</p>
                        <div className="media-preview-items">
                          {mediaFiles.map((file, index) => (
                              <div key={index} className="media-preview-item new">
                                <img src={file.data} alt={`New media ${index + 1}`} />
                              </div>
                          ))}
                        </div>
                      </div>
                  )}
                </div>

                <div className="tutorial-form__actions">
                  <button type="submit" disabled={loading} className="tutorial-button tutorial-button--primary">
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                      type="button"
                      onClick={handleEditToggle}
                      className="tutorial-button tutorial-button--danger"
                  >
                    Cancel
                  </button>
                </div>
              </form>
          )}
        </section>
      </>
  );
};

export default TutorialDetail;