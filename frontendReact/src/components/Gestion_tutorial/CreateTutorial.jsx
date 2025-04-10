import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Back from "../common/back/Back";
import axios from "axios";
import "./tutorialStyles.css";

const CreateTutorial = () => {
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    userId: "",
  });
  const [mediaFiles, setMediaFiles] = useState([]); // Store base64 media
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = user._id || "";
    if (!userId) {
      navigate("/signin");
      return;
    }
    setFormData((prev) => ({ ...prev, userId }));

    const fetchSkills = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/admin/skills");
        setSkills(response.data);
        if (response.data.length > 0) {
          setFormData((prev) => ({ ...prev, category: response.data[0].name }));
        }
      } catch (err) {
        setSubmitError("Failed to load skills");
        console.error("Error fetching skills:", err);
      }
    };
    fetchSkills();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const filePromises = files.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            data: reader.result, // Base64 string
            contentType: file.type,
            length: file.size,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises)
      .then((mediaArray) => setMediaFiles(mediaArray))
      .catch((err) => console.error("Error converting files:", err));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.content.trim()) newErrors.content = "Content is required.";
    if (!formData.category) newErrors.category = "Category is required.";
    if (!formData.userId) newErrors.userId = "User ID is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const data = {
      ...formData,
      media: JSON.stringify(mediaFiles), // Stringify media array
    };

    try {
      setLoading(true);
      setSubmitError(null);
      console.log("Sending data:", data);

      // Step 1: Send tutorial creation data to the backend
      const response = await axios.post("http://localhost:5000/api/tutorials/create", data);

      // Step 2: Navigate after success
      navigate("/tutorials");
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Failed to create tutorial");
      console.error("Submission error:", error.response?.data);
      if (error.response?.status === 401) navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Back title="Create a Tutorial" />
      <section className="tutorial-section">
        <form onSubmit={handleSubmit} className="tutorial-form">
          <h2 className="tutorial-form__title">Create Your Tutorial</h2>
          {submitError && <p className="tutorial-form__error">{submitError}</p>}
          <div className="tutorial-form__field">
            <label className="tutorial-form__label">Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter tutorial title"
              className="tutorial-form__input"
            />
            {errors.title && <p className="tutorial-form__field-error">{errors.title}</p>}
          </div>
          <div className="tutorial-form__field">
            <label className="tutorial-form__label">Content</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Write your tutorial content"
              className="tutorial-form__textarea"
            />
            {errors.content && <p className="tutorial-form__field-error">{errors.content}</p>}
          </div>
          <div className="tutorial-form__field">
            <label className="tutorial-form__label">Category</label>
            {skills.length === 0 ? (
              <p>Loading skills...</p>
            ) : (
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="tutorial-form__select"
              >
                {skills.map((skill) => (
                  <option key={skill._id} value={skill.name}>
                    {skill.name}
                  </option>
                ))}
              </select>
            )}
            {errors.category && <p className="tutorial-form__field-error">{errors.category}</p>}
          </div>
          <div className="tutorial-form__field">
            <label className="tutorial-form__label">Images</label>
            <input
              type="file"
              name="media"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="tutorial-form__input"
            />
          </div>
          <button
            type="submit"
            disabled={loading || skills.length === 0}
            className="tutorial-button"
          >
            {loading ? "Creating..." : "Create Tutorial"}
          </button>
        </form>
      </section>
    </>
  );
};

export default CreateTutorial;
