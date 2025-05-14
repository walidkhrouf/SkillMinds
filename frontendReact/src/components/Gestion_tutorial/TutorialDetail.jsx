import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Back from "../common/back/Back";
import axios from "axios";
import {
  FaRegThumbsUp,
  FaRegCommentAlt,
  FaShare,
  FaFacebook,
  FaInstagram,
  FaEnvelope,
  FaRegEdit,
  FaTrashAlt,
  FaDownload
} from "react-icons/fa";
import { AiFillLike } from "react-icons/ai";
import "./tutorialStyles.css";

const TutorialDetail = () => {
  const { tutorialId } = useParams();
  const navigate = useNavigate();
  const [tutorial, setTutorial] = useState(null);
  const [comments, setComments] = useState([]);
  const [likes, setLikes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
      userId: "",
    media: []
  });
  const [commentContent, setCommentContent] = useState("");
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [language, setLanguage] = useState("en");
  const [shareModal, setShareModal] = useState({ visible: false, url: "" });
  const [selectedContent, setSelectedContent] = useState("");
  const [showFullContent, setShowFullContent] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const userId = currentUser._id || "";

  useEffect(() => {
    if (!userId) {
      navigate("/signin");
      return;
    }
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/tutorials/${tutorialId}`
        );
        setTutorial(data.tutorial);
        setComments(data.comments);
        setLikes(data.likes);
        setFormData({
          title: data.tutorial.title,
          content: data.tutorial.content,
          category: data.tutorial.category,
        });
      } catch (e) {
        setError("Unable to load the tutorial.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [tutorialId, userId, navigate]);

  const handleLike = async () => {
    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/tutorials/${tutorialId}/like`,
        { userId }
      );
      setLikes(data.likes);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to like.");
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentContent.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    try {
      const { data } = await axios.post(
        `http://localhost:5000/api/tutorials/${tutorialId}/comment`,
        {
          content: commentContent,
          userId: userId,
        }
      );
      setComments((c) => [...c, data.comment]);
      setCommentContent("");
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to add comment.");
    }
  };

  const handleEditComment = async (id) => {
    if (!editingCommentContent.trim()) {
      setError("Comment cannot be empty.");
      return;
    }

    try {
      const { data } = await axios.put(
        `http://localhost:5000/api/tutorials/comment/${id}`,
        { content: editingCommentContent, userId }
      );
      setComments((c) => c.map((cm) => (cm._id === id ? data.comment : cm)));
      setEditingCommentId(null);
      setEditingCommentContent("");
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to edit comment.");
    }
  };

  const handleDeleteComment = async (id) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/tutorials/comment/${id}`, {
        data: { userId },
      });
      setComments((c) => c.filter((cm) => cm._id !== id));
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete comment.");
    }
  };

  const handleEditToggle = () => {
    setIsEditing((e) => !e);
    setError("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { data } = await axios.put(
        `http://localhost:5000/api/tutorials/${tutorialId}`,
        { ...formData, userId }
      );
      setTutorial(data.tutorial);
      setIsEditing(false);
      setError("");
    } catch (e) {
      setError(e.response?.data?.message || "Failed to update tutorial.");
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
    } catch (e) {
      setError(e.response?.data?.message || "Failed to delete tutorial.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (url) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = url.split("/").pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

   // Traduction du contenu
  const changeLanguage = async (lang) => {
    setLanguage(lang);
    try {
      const { data } = await axios.post(
        "https://api-translate.systran.net/translation/text/translate",
        { input: [tutorial.content], source: "auto", target: lang },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: "Key a9b3aa86-93de-4531-ab69-59e997285d3c",
          },
        }
      );
      setTutorial((t) => ({ ...t, content: data.outputs[0].output }));
    } catch {
      setError("Échec de la traduction.");
    }
  };

  const handleShareClick = () => {
    setShareModal({
      visible: true,
      url: `${window.location.origin}/tutorials/${tutorialId}`,
    });
  };

  const ShareModal = ({ url, onClose }) => (
    <div className="share-modal-overlay">
      <div className="share-modal">
        <h3>Share this tutorial</h3>
        <div className="share-buttons">
          <button
            onClick={() =>
              window.open(
                `https://facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                "_blank"
              )
            }
          >
            <FaFacebook /> Facebook
          </button>
          <button
            onClick={() =>
              window.open(
                `https://instagram.com/?url=${encodeURIComponent(url)}`,
                "_blank"
              )
            }
          >
            <FaInstagram /> Instagram
          </button>
          <button
            onClick={() =>
              (window.location.href = `mailto:?subject=Tutorial&body=${encodeURIComponent(
                url
              )}`)
            }
          >
            <FaEnvelope /> Email
          </button>
        </div>
        <button className="close-modal" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!tutorial) return <div className="not-found">Tutorial not found</div>;

  const isOwner = tutorial.authorId._id === userId;

  return (
    <>
      <Back title={tutorial.title} />
      <section className="tutorial-detail-container">
        {isEditing ? (
          
          <form onSubmit={handleEditSubmit} className="edit-tutorial-form">
            
            <h2>Edit Tutorial</h2>
            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                name="category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                required
              />
            </div>
            <div className="form-actions">
              <button type="submit" className="save-btn">
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleEditToggle}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <article className="tutorial-content">
              
<div className="tutorial-header">
                <h1>{tutorial.title}</h1>
                
              </div>
              <div className="tutorial-meta">
                  <span className="author">
                    By {tutorial.authorId.username}
                  </span>
                  <span className="category">{tutorial.category}</span>
                  <span className="date">
                    {new Date(tutorial.createdAt).toLocaleDateString()}
                  </span>
                </div>
              <div className="language-selector">
                <select
                  value={language}
                  onChange={(e) => changeLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </div>

              <div className="tutorial-body">
                <div className="content-section">
                  {showFullContent ? (
                    <div className="full-content">
                      {tutorial.content}
                      <button
                        className="show-less-btn"
                        onClick={() => setShowFullContent(false)}
                      >
                        Show Less
                      </button>
                    </div>
                  ) : (
                    <div className="preview-content">
                      {tutorial.content.length > 500
                        ? `${tutorial.content.substring(0, 500)}...`
                        : tutorial.content}
                      {tutorial.content.length > 500 && (
                        <button
                          className="show-more-btn"
                          onClick={() => {
                            setSelectedContent(tutorial.content);
                            setShowFullContent(true);
                          }}
                        >
                          Read More
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {tutorial.media && tutorial.media.length > 0 && (
                  <div className="media-gallery">
                    <h3>Media</h3>
                    <div className="media-grid">
                      {tutorial.media.map((media, index) => (
                        <div key={index} className="media-item">
                          {media.contentType.startsWith("image") ? (
                            <img
                              src={media.data}
                              alt={`Tutorial media ${index + 1}`}
                              className="media-image"
                            />
                          ) : (
                            <div className="media-placeholder">
                              <p>Media content</p>
                            </div>
                          )}
                          <button
                            onClick={() => handleDownload(media.data)}
                            className="download-media-btn"
                          >
                            <FaDownload /> Download
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

             <div className="tutorial-actions">
  <button
    className={`like-btn ${likes > 0 ? "liked" : ""}`}
    onClick={handleLike}
  >
    <AiFillLike /> {likes} 
  </button>
  <button className="comment-btn">
    <FaRegCommentAlt /> {comments.length} 
  </button>
  <button className="share-btn" onClick={handleShareClick}>
    <FaShare /> Share
  </button>

  {isOwner && (
    <>
      <button className="edit-btn" onClick={handleEditToggle}>
        <FaRegEdit /> Edit
      </button>
      <button className="delete-btn" onClick={handleDelete}>
        <FaTrashAlt /> Delete
      </button>
    </>
  )}
</div>
            </article>

            <section className="comments-section">
              <h2>Comments ({comments.length})</h2>
              <div className="comments-list">
                {comments.map((comment) => (
                  <div key={comment._id} className="comment-card">
                    <div className="comment-header">
                      <span className="comment-author">
                        {comment.userId.username}
                      </span>
                      <span className="comment-date">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {editingCommentId === comment._id ? (
                      <div className="edit-comment-form">
                        <textarea
                          value={editingCommentContent}
                          onChange={(e) =>
                            setEditingCommentContent(e.target.value)
                          }
                        />
                        <div className="edit-comment-actions">
                          <button
                            className="save-edit-btn"
                            onClick={() => handleEditComment(comment._id)}
                          >
                            Save
                          </button>
                          <button
                            className="cancel-edit-btn"
                            onClick={() => setEditingCommentId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="comment-content">
                          {comment.content}
                        </div>
                        {comment.userId._id === userId && (
                          <div className="comment-actions">
                            <button
                              className="edit-comment-btn"
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditingCommentContent(comment.content);
                              }}
                            >
                              <FaRegEdit /> Edit
                            </button>
                            <button
                              className="delete-comment-btn"
                              onClick={() => handleDeleteComment(comment._id)}
                            >
                              <FaTrashAlt /> Delete
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>

              <form onSubmit={handleCommentSubmit} className="add-comment-form">
                <textarea
                  placeholder="Write your comment..."
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  required
                />
                <button type="submit" className="submit-comment-btn">
                  Post Comment
                </button>
              </form>
            </section>
          </>
        )}

        {shareModal.visible && (
          <ShareModal
            url={shareModal.url}
            onClose={() => setShareModal({ visible: false, url: "" })}
          />
        )}

        {showFullContent && (
          <div className="full-content-modal">
            <div className="modal-content">
              <h3>{tutorial.title}</h3>
              <div className="modal-body">
                {selectedContent}
              </div>
              <button
                className="close-modal-btn"
                onClick={() => setShowFullContent(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </section>
    </>
  );
};

export default TutorialDetail;  