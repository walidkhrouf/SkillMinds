import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Back from "../common/back/Back";
import axios from "axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import * as SpeechSDK from "microsoft-cognitiveservices-speech-sdk";
import "./groupStyles.css";

const CreateGroupPost = () => {
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    content: "",
  });
  const [mediaFiles, setMediaFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [speechLanguage, setSpeechLanguage] = useState("en-US");
  const [recognizedText, setRecognizedText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [isCheckingBadWords, setIsCheckingBadWords] = useState(false);
  const [groupName, setGroupName] = useState("");
  const { groupId } = useParams();
  const navigate = useNavigate();
  const recognizerRef = useRef(null);

  const AZURE_TTS_KEY = import.meta.env.VITE_AZURE_TTS_KEY || "";
  const AZURE_TTS_REGION = import.meta.env.VITE_AZURE_TTS_REGION || "francecentral";
  const AZURE_CONTENT_SAFETY_KEY = import.meta.env.VITE_AZURE_CONTENT_SAFETY_KEY || "";
  const AZURE_CONTENT_SAFETY_ENDPOINT = import.meta.env.VITE_AZURE_CONTENT_SAFETY_ENDPOINT || "https://badwordsdetection.cognitiveservices.azure.com/";
  const BACKEND_URL = "http://localhost:5001/generate-content";

  const localBadWords = [
    "racism",
    "hate",
    "violence",
    "sexism",
    "discrimination",
    "merde",
  ];

  const hasLocalBadWords = (text) => {
    const badWordPatterns = localBadWords.map((word) => new RegExp(`\\b${word}\\b`, "i"));
    return badWordPatterns.some((pattern) => pattern.test(text));
  };

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) navigate("/signin");
  }, [navigate]);

  useEffect(() => {
    const fetchGroupName = async () => {
      try {
        const jwtToken = localStorage.getItem("jwtToken");
        const response = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
          headers: {
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        setGroupName(response.data.name);
      } catch (error) {
        console.error("Failed to fetch group name:", error);
        setGroupName("Unknown Group");
        if (error.response?.status === 401) navigate("/signin");
      }
    };

    fetchGroupName();
  }, [groupId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (value.trim()) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleContentChange = (value) => {
    setFormData({ ...formData, content: value });
    setRecognizedText(value);
    if (value.trim() && value !== "<p><br></p>") setErrors((prev) => ({ ...prev, content: "" }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = [];
    const invalidFiles = [];

    files.forEach((file) => {
      if (file.type.startsWith("image") || file.type.startsWith("video")) {
        validFiles.push(file);
      } else {
        invalidFiles.push(file.name);
      }
    });

    if (invalidFiles.length > 0) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        media: `Invalid file types (${invalidFiles.join(", ")}). Only images and videos are allowed.`,
      }));
      setMediaFiles([]);
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, media: "" }));
      setMediaFiles(validFiles);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required.";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
    if (!formData.content.trim() || formData.content === "<p><br></p>") newErrors.content = "Content is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const checkBadWords = async (text) => {
    if (!AZURE_CONTENT_SAFETY_KEY || !AZURE_CONTENT_SAFETY_ENDPOINT) {
      console.error("Azure Content Safety configuration is missing: Key or Endpoint not set.");
      setSubmitError("Content safety check unavailable due to missing configuration.");
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
      setSubmitError(`Content safety check failed: ${error.response?.data?.error?.message || error.message}`);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const textToCheck = `${formData.title} ${formData.subject} ${formData.content.replace(/<[^>]+>/g, " ")}`;

    if (hasLocalBadWords(textToCheck)) {
      setSubmitError("Inappropriate language detected! Please revise your content.");
      return;
    }

    setIsCheckingBadWords(true);
    setSubmitError("Checking for inappropriate language...");

    const hasBadWords = await checkBadWords(textToCheck);
    setIsCheckingBadWords(false);

    if (hasBadWords) {
      setSubmitError("Inappropriate language detected! Please revise your content.");
      return;
    }

    const jwtToken = localStorage.getItem("jwtToken");
    const postData = new FormData();
    postData.append("title", formData.title);
    postData.append("subject", formData.subject);
    postData.append("content", formData.content);
    postData.append("groupId", groupId);
    mediaFiles.forEach((file) => postData.append("media", file));

    try {
      setLoading(true);
      setSubmitError(null);
      await axios.post("http://localhost:5000/api/groups/posts/create", postData, {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "multipart/form-data",
        },
      });
      navigate(`/groups/${groupId}`);
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Failed to create post.");
      if (error.response?.status === 401) navigate("/signin");
    } finally {
      setLoading(false);
    }
  };

  const handleSpeechToText = () => {
    if (!AZURE_TTS_KEY || !AZURE_TTS_REGION) {
      setSubmitError("Speech-to-Text configuration is missing.");
      console.error("Missing AZURE_TTS_KEY or AZURE_TTS_REGION");
      return;
    }

    if (isRecording) {
      if (recognizerRef.current) {
        recognizerRef.current.stopContinuousRecognitionAsync(
            () => {
              recognizerRef.current.close();
              recognizerRef.current = null;
              setIsRecording(false);
              setInterimText("");
              console.log("Recording stopped.");
            },
            (error) => {
              console.error("Stop Recognition Error:", error);
              setSubmitError("Failed to stop recording.");
              recognizerRef.current.close();
              recognizerRef.current = null;
              setIsRecording(false);
              setInterimText("");
            }
        );
      }
      return;
    }

    const speechConfig = SpeechSDK.SpeechConfig.fromSubscription(AZURE_TTS_KEY, AZURE_TTS_REGION);
    speechConfig.speechRecognitionLanguage = speechLanguage;
    const audioConfig = SpeechSDK.AudioConfig.fromDefaultMicrophoneInput();
    recognizerRef.current = new SpeechSDK.SpeechRecognizer(speechConfig, audioConfig);

    setIsRecording(true);

    recognizerRef.current.recognizing = (s, e) => {
      setInterimText(e.result.text);
    };

    recognizerRef.current.recognized = (s, e) => {
      if (e.result.reason === SpeechSDK.ResultReason.RecognizedSpeech) {
        const finalText = e.result.text;
        setRecognizedText((prevText) => {
          const updatedText =
              prevText === "" || prevText === "<p><br></p>"
                  ? `<p>${finalText}</p>`
                  : `${prevText}<p>${finalText}</p>`;
          setFormData((prevFormData) => ({
            ...prevFormData,
            content: updatedText,
          }));
          return updatedText;
        });
        setInterimText("");
        setErrors((prev) => ({ ...prev, content: "" }));
      }
    };

    recognizerRef.current.canceled = (s, e) => {
      console.error("Recognition Canceled:", e.reason);
      setSubmitError("Recognition canceled. Check microphone or network.");
      recognizerRef.current.close();
      recognizerRef.current = null;
      setIsRecording(false);
      setInterimText("");
    };

    recognizerRef.current.sessionStopped = () => {
      console.log("Session stopped.");
      recognizerRef.current.close();
      recognizerRef.current = null;
      setIsRecording(false);
      setInterimText("");
    };

    recognizerRef.current.startContinuousRecognitionAsync(
        () => {
          console.log("Continuous recognition started.");
        },
        (error) => {
          console.error("Start Recognition Error:", error);
          setSubmitError("Failed to start recording.");
          recognizerRef.current.close();
          recognizerRef.current = null;
          setIsRecording(false);
          setInterimText("");
        }
    );
  };

  const handleGenerateContent = async () => {
    if (!formData.title && !formData.subject) {
      setSubmitError("Please enter a title or subject to generate content.");
      return;
    }

    const prompt = `Generate a content about "${formData.title || formData.subject}". Include specific many information and examples, keep it under 300 words and if the demand is codes so you should write codes sources, and provide only the post content without repeating this instruction.`;
    setIsGenerating(true);
    setSubmitError(null);

    try {
      const response = await axios.post(BACKEND_URL, { prompt });
      const generatedText = response.data.generated_text.trim();
      const newContent =
          formData.content === "<p><br></p>" || !formData.content
              ? `<p>${generatedText}</p>`
              : `${formData.content}<p>${generatedText}</p>`;
      setFormData({ ...formData, content: newContent });
      setRecognizedText(newContent);
      setErrors((prev) => ({ ...prev, content: "" }));
    } catch (error) {
      setSubmitError(
          error.response?.data?.error || "Failed to generate content. Check if backend is running and API key is valid."
      );
      console.error("Content Generation Error:", error.response?.data || error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const displayContent = isRecording && interimText
      ? `${formData.content}<p>${interimText}</p>`
      : formData.content;

  const quillModules = {
    toolbar: [
      [{ header: [1, 2, false] }],
      ["bold", "italic", "underline", "strike", "blockquote"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["code-block"],
      ["link"],
      ["clean"],
    ],
  };

  return (
      <>
        <Back title="Create a Group Post" />
        <section className="group-section">
          <form onSubmit={handleSubmit} className="group-form">
            <h2 className="group-form__title">Add a Post to {groupName}</h2>
            {submitError && <p className="group-form__error">{submitError}</p>}
            <div className="group-form__field">
              <label className="group-form__label">Title</label>
              <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter post title"
                  className="group-form__input"
                  aria-required="true"
              />
              {errors.title && <p className="group-form__field-error">{errors.title}</p>}
            </div>
            <div className="group-form__field">
              <label className="group-form__label">Subject</label>
              <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="Enter post subject"
                  className="group-form__input"
                  aria-required="true"
              />
              {errors.subject && <p className="group-form__field-error">{errors.subject}</p>}
            </div>
            <div className="group-form__field">
              <label className="group-form__label">Content</label>
              <ReactQuill
                  value={displayContent}
                  onChange={handleContentChange}
                  modules={quillModules}
                  placeholder="Write, speak, or generate your post content here..."
                  className="group-form__quill"
                  aria-required="true"
              />
              {errors.content && <p className="group-form__field-error">{errors.content}</p>}
              <div className="group-form__speech-controls">
                <select
                    value={speechLanguage}
                    onChange={(e) => setSpeechLanguage(e.target.value)}
                    className="group-form__language-select"
                    disabled={isRecording}
                    aria-label="Select speech language"
                >
                  <option value="en-US">English (US)</option>
                  <option value="fr-FR">French</option>
                  <option value="ar-SA">Arabic (Saudi Arabia)</option>
                </select>
                <button
                    type="button"
                    onClick={handleSpeechToText}
                    className={`group-button group-form__record-btn ${isRecording ? "recording" : ""}`}
                    disabled={loading || isGenerating || isCheckingBadWords}
                    aria-label={isRecording ? "Stop recording" : "Start recording"}
                    title={isRecording ? "Stop Recording" : "Record Content"}
                >
                  <i className={`fas ${isRecording ? "fa-stop" : "fa-microphone"}`}></i>
                  {isRecording ? "Stop Recording" : "Record Content"}
                </button>
                <button
                    type="button"
                    onClick={handleGenerateContent}
                    className={`group-button group-form__generate-btn ${isGenerating ? "generating" : ""}`}
                    disabled={loading || isRecording || isCheckingBadWords}
                    aria-label={isGenerating ? "Generating content" : "Generate content"}
                    title={isGenerating ? "Generating..." : "Generate Content"}
                >
                  <i className="fas fa-magic"></i>
                  {isGenerating ? "Generating..." : "Generate Content"}
                </button>
                {isRecording && <span className="group-form__recording-indicator">Recording...</span>}
              </div>
            </div>
            <div className="group-form__field">
              <label className="group-form__label">Media (Optional)</label>
              <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="group-form__input"
                  aria-label="Upload media files"
              />
              {errors.media && <p className="group-form__field-error">{errors.media}</p>}
              {mediaFiles.length > 0 && (
                  <div className="group-form__media-preview">
                    {mediaFiles.map((file, index) => (
                        <div key={index} className="group-form__media-item">
                          {file.type.startsWith("image") ? (
                              <img
                                  src={URL.createObjectURL(file)}
                                  alt={file.name}
                                  className="group-form__media-image"
                              />
                          ) : (
                              <video
                                  src={URL.createObjectURL(file)}
                                  controls
                                  className="group-form__media-video"
                              />
                          )}
                          <p>{file.name}</p>
                        </div>
                    ))}
                  </div>
              )}
            </div>
            <div className="group-form__actions">
              <button
                  type="submit"
                  disabled={loading || isRecording || isGenerating || isCheckingBadWords}
                  className="group-button group-form__submit-btn"
                  aria-label="Create post"
                  title="Create Post"
              >
                <i className="fas fa-paper-plane"></i>
                {isCheckingBadWords ? "Checking..." : loading ? "Posting..." : "Create Post"}
              </button>
              <button
                  type="button"
                  onClick={() => navigate(`/groups/${groupId}`)}
                  className="group-button group-form__cancel-btn"
                  aria-label="Cancel and go back"
                  title="Cancel"
              >
                <i className="fas fa-times"></i>
                Cancel
              </button>
            </div>
          </form>
        </section>
      </>
  );
};

export default CreateGroupPost;