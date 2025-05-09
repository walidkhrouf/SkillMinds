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
  const [mediaFiles, setMediaFiles] = useState([]); // for Base64 uploads
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // grab userId or redirect
    const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
    const userId = user._id || "";
    if (!userId) return navigate("/signin");
    setFormData((f) => ({ ...f, userId }));

    // load categories/skills
    axios
        .get("http://localhost:5000/api/admin/skills")
        .then((res) => {
          setSkills(res.data);
          if (res.data.length) {
            setFormData((f) => ({ ...f, category: res.data[0].name }));
          }
        })
        .catch(() => setSubmitError("Failed to load categories."));
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    setErrors((err) => ({ ...err, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    Promise.all(
        files.map(
            (file) =>
                new Promise((resolve) => {
                  const reader = new FileReader();
                  reader.onloadend = () =>
                      resolve({
                        data: reader.result,
                        contentType: file.type,
                        size: file.size,
                      });
                  reader.readAsDataURL(file);
                })
        )
    )
        .then((arr) => setMediaFiles(arr))
        .catch(console.error);
  };

  const validate = () => {
    const errs = {};
    if (!formData.title.trim()) errs.title = "Title is required.";
    if (!formData.content.trim()) errs.content = "Content is required.";
    if (!formData.category) errs.category = "Category is required.";
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setSubmitError(null);

    try {
      await axios.post("http://localhost:5000/api/tutorials/create", {
        ...formData,
        media: JSON.stringify(mediaFiles),
      });
      navigate("/tutorials");
    } catch (err) {
      setSubmitError(err.response?.data?.message || "Creation failed.");
      if (err.response?.status === 401) navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        <Back title="Create a Tutorial" />
        <section className="tutorial-section">
          <form onSubmit={handleSubmit} className="tutorial-form enhanced">
            <h2 className="tutorial-detail__title">Create Your Tutorial</h2>
            {submitError && (
                <p className="tutorial-detail__error">{submitError}</p>
            )}

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
              {errors.title && (
                  <p className="tutorial-form__field-error">{errors.title}</p>
              )}
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
              {errors.content && (
                  <p className="tutorial-form__field-error">{errors.content}</p>
              )}
            </div>

            <div className="tutorial-form__field">
              <label className="tutorial-form__label">Category</label>
              {skills.length === 0 ? (
                  <p>Loading categories…</p>
              ) : (
                  <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="tutorial-form__select"
                  >
                    {skills.map((s) => (
                        <option key={s._id} value={s.name}>
                          {s.name}
                        </option>
                    ))}
                  </select>
              )}
              {errors.category && (
                  <p className="tutorial-form__field-error">{errors.category}</p>
              )}
            </div>

            <div className="tutorial-form__field">
              <label className="tutorial-form__label">Media (images)</label>
              <input
                  type="file"
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
              {loading ? "Creating…" : "Create Tutorial"}
            </button>
          </form>
        </section>
      </>
  );
};

export default CreateTutorial;
