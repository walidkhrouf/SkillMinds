import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Back from "../common/back/Back";
import axios from "axios";
import "./groupStyles.css";

const CreateGroup = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    privacy: "public",
    skillId: "",
  });
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isCheckingBadWords, setIsCheckingBadWords] = useState(false);
  const navigate = useNavigate();

  const AZURE_CONTENT_SAFETY_KEY = import.meta.env.VITE_AZURE_CONTENT_SAFETY_KEY || "";
  const AZURE_CONTENT_SAFETY_ENDPOINT = import.meta.env.VITE_AZURE_CONTENT_SAFETY_ENDPOINT || "https://badwordsdetection.cognitiveservices.azure.com/";

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      navigate("/signin");
      return;
    }

    const fetchSkills = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/api/admin/skills", {
          headers: { Authorization: `Bearer ${jwtToken}` },
        });
        setSkills(response.data);
      } catch (err) {
        setSubmitError("Failed to load skills.");
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.trim() || name === "privacy" || name === "skillId") setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.description.trim()) newErrors.description = "Description is required.";
    if (!formData.privacy) newErrors.privacy = "Privacy setting is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkBadWords = async (text) => {
    if (!AZURE_CONTENT_SAFETY_KEY || !AZURE_CONTENT_SAFETY_ENDPOINT) {
      console.error("Azure Content Safety configuration is missing: Key or Endpoint not set.");
      setSubmitError("Content safety check unavailable. Proceeding with local check only.");
      return false;
    }

    try {
      const response = await axios.post(
          `${AZURE_CONTENT_SAFETY_ENDPOINT}/contentsafety/text:analyze?api-version=2023-10-01`,
          {
            text,
            categories: ["Hate", "Sexual", "SelfHarm", "Violence"],
            outputType: "FourSeverityLevels",
          },
          {
            headers: {
              "Ocp-Apim-Subscription-Key": AZURE_CONTENT_SAFETY_KEY,
              "Content-Type": "application/json",
            },
          }
      );
      const analysis = response.data;
      const hasBadWords = analysis.categoriesAnalysis.some((category) => category.severity > 0);
      console.log("Content Safety Response:", analysis);
      return hasBadWords;
    } catch (error) {
      console.error("Bad words check failed:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      setSubmitError(`Content safety check failed: ${error.response?.data?.error?.message || error.message}. Proceeding with local check only.`);
      return false;
    }
  };

  const localBadWords = [
    "racism",
    "hate",
    "violence",
    "sexism",
    "discrimination",
    // Add more
  ];

  const hasLocalBadWords = (text) => {
    return localBadWords.some((word) => text.toLowerCase().includes(word));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const textToCheck = `${formData.name} ${formData.description}`;

    // Step 1: Check local bad words list
    if (hasLocalBadWords(textToCheck)) {
      setSubmitError("Inappropriate language detected! Please revise your content.");
      return;
    }

    // Step 2: Proceed with Azure Content Safety API check
    setIsCheckingBadWords(true);
    setSubmitError("Checking for inappropriate language...");

    try {
      const hasBadWords = await checkBadWords(textToCheck);
      if (hasBadWords) {
        setSubmitError("Inappropriate language detected! Please revise your content.");
        return;
      }

      // Step 3: Submit the form if no bad words are detected
      const jwtToken = localStorage.getItem("jwtToken");
      setLoading(true);
      setSubmitError(null);
      await axios.post(
          "http://localhost:5000/api/groups/create",
          {
            name: formData.name,
            description: formData.description,
            privacy: formData.privacy,
            skillId: formData.skillId || null,
          },
          { headers: { Authorization: `Bearer ${jwtToken}` } }
      );
      navigate("/groups");
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Failed to create group.");
      if (error.response?.status === 401) navigate("/signin");
    } finally {
      setIsCheckingBadWords(false);
      setLoading(false);
    }
  };

  return (
      <>
        <Back title="Create a Group" />
        <section className="group-section">
          <div className="group-container">
            <form onSubmit={handleSubmit} className="group-form">
              <h2 className="group-form__title">Create Your Group</h2>
              {submitError && <p className="group-form__error">{submitError}</p>}
              <div className="group-form__field">
                <label className="group-form__label">Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter group name"
                    className="group-form__input"
                />
                {errors.name && <p className="group-form__field-error">{errors.name}</p>}
              </div>
              <div className="group-form__field">
                <label className="group-form__label">Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your group"
                    className="group-form__textarea"
                />
                {errors.description && <p className="group-form__field-error">{errors.description}</p>}
              </div>
              <div className="group-form__field">
                <label className="group-form__label">Privacy</label>
                <select
                    name="privacy"
                    value={formData.privacy}
                    onChange={handleChange}
                    className="group-form__select"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                {errors.privacy && <p className="group-form__field-error">{errors.privacy}</p>}
              </div>
              <div className="group-form__field">
                <label className="group-form__label">Skill (Optional)</label>
                {loading ? (
                    <p>Loading skills...</p>
                ) : (
                    <select
                        name="skillId"
                        value={formData.skillId}
                        onChange={handleChange}
                        className="group-form__select"
                    >
                      <option value="">None</option>
                      {skills.map((skill) => (
                          <option key={skill._id} value={skill._id}>
                            {skill.name} ({skill.category})
                          </option>
                      ))}
                    </select>
                )}
              </div>
              <button
                  type="submit"
                  disabled={loading || isCheckingBadWords}
                  className="group-button"
              >
                {isCheckingBadWords ? "Checking..." : loading ? "Creating..." : "Create Group"}
              </button>
            </form>
          </div>
        </section>
      </>
  );
};

export default CreateGroup;