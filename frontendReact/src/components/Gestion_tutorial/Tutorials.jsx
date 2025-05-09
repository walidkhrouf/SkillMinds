import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Back from "../common/back/Back";
import axios from "axios";
import {
  FaRegThumbsUp,
  FaRegCommentAlt,
  FaShare,
  FaFacebook,
  FaInstagram,
  FaEnvelope,
} from "react-icons/fa";
import { AiFillLike, AiFillHeart } from "react-icons/ai";
import "./tutorialStyles.css";

const Tutorials = () => {
  const [tutorials, setTutorials] = useState([]);
  const [filteredTutorials, setFilteredTutorials] = useState([]);
  const [comments, setComments] = useState({});
  const [likes, setLikes] = useState({});
  const [commentContent, setCommentContent] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [shareModal, setShareModal] = useState({ visible: false, url: "" });

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const tutorialsPerPage = 3;

  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem("currentUser") || "{}")._id || "";

  useEffect(() => {
    const fetchTutorials = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/api/tutorials");
        setTutorials(response.data);
        setFilteredTutorials(response.data);

        // Initialize comments and likes
        const initialComments = {};
        const initialLikes = {};
        const initialCommentContent = {};

        for (const t of response.data) {
          const detail = await axios.get(
              `http://localhost:5000/api/tutorials/${t._id}`
          );
          initialComments[t._id] = detail.data.comments || [];
          initialLikes[t._id] = detail.data.likes || 0;
          initialCommentContent[t._id] = "";
        }

        setComments(initialComments);
        setLikes(initialLikes);
        setCommentContent(initialCommentContent);
      } catch {
        setError("Failed to load tutorials");
      } finally {
        setLoading(false);
      }
    };
    fetchTutorials();
  }, []);

  // reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filteredTutorials]);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (!term) {
      setFilteredTutorials(tutorials);
    } else {
      setFilteredTutorials(
          tutorials.filter(
              (t) =>
                  t.title.toLowerCase().includes(term.toLowerCase()) ||
                  t.category.toLowerCase().includes(term.toLowerCase())
          )
      );
    }
  };

  const handleTutorialClick = (id) => {
    navigate(`/tutorials/${id}`);
  };

  const handleLike = async (id) => {
    try {
      const res = await axios.post(
          `http://localhost:5000/api/tutorials/${id}/like`,
          { userId }
      );
      setLikes((prev) => ({
        ...prev,
        [id]:
            res.data.message === "Like removed"
                ? prev[id] - 1
                : prev[id] + 1,
      }));
      const detail = await axios.get(
          `http://localhost:5000/api/tutorials/${id}`
      );
      setLikes((prev) => ({ ...prev, [id]: detail.data.likes }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to like tutorial");
    }
  };

  const checkForBadWords = async (comment) => {
    const apiKey = "97b6f4bf49msh5e3c302c88403e5p14d202jsnfcd1ea32122a";
    const badWordsAPI =
        "https://neutrinoapi-bad-word-filter.p.rapidapi.com/bad-word-filter";
    const params = new URLSearchParams();
    params.set("content", comment);
    params.set("censor-character", "*");
    try {
      const res = await axios.request({
        method: "POST",
        url: badWordsAPI,
        headers: {
          "x-rapidapi-key": apiKey,
          "x-rapidapi-host":
              "neutrinoapi-bad-word-filter.p.rapidapi.com",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: params,
      });
      return res.data.censored;
    } catch {
      return false;
    }
  };

  const handleCommentSubmit = async (e, id) => {
    e.preventDefault();
    const content = commentContent[id]?.trim();
    if (!content) return;
    if (await checkForBadWords(content)) {
      alert("Votre commentaire contient un langage inapproprié.");
      return;
    }
    try {
      const res = await axios.post(
          `http://localhost:5000/api/tutorials/${id}/comment`,
          { content, userId }
      );
      setComments((prev) => ({
        ...prev,
        [id]: [...prev[id], res.data.comment],
      }));
      setCommentContent((prev) => ({ ...prev, [id]: "" }));
      const detail = await axios.get(
          `http://localhost:5000/api/tutorials/${id}`
      );
      setComments((prev) => ({ ...prev, [id]: detail.data.comments }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleCommentChange = (id, val) =>
      setCommentContent((prev) => ({ ...prev, [id]: val }));

  const handleShareClick = (id) => {
    setShareModal({
      visible: true,
      url: `${window.location.origin}/tutorials/${id}`,
    });
  };

  const ShareModal = ({ url, onClose }) => (
      <div className="share-modal-overlay">
        <div className="share-modal">
          <h3>Share this Tutorial</h3>
          <div className="share-buttons">
            <button
                onClick={() =>
                    window.open(
                        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                            url
                        )}`,
                        "_blank"
                    )
                }
                className="share-button facebook"
            >
              <FaFacebook /> Facebook
            </button>
            <button
                onClick={() =>
                    window.open(
                        `https://www.instagram.com/?url=${encodeURIComponent(
                            url
                        )}`,
                        "_blank"
                    )
                }
                className="share-button instagram"
            >
              <FaInstagram /> Instagram
            </button>
            <button
                onClick={() =>
                    (window.location.href = `mailto:?subject=Check%20this%20tutorial&body=${encodeURIComponent(
                        url
                    )}`)
                }
                className="share-button email"
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredTutorials.length / tutorialsPerPage);
  const startIdx = (currentPage - 1) * tutorialsPerPage;
  const currentTutorials = filteredTutorials.slice(
      startIdx,
      startIdx + tutorialsPerPage
  );

  return (
      <>
        <Back title="Tutorials" />
        <section className="tutorial-section">
          <h2 className="tutorial-list__title">All Tutorials</h2>
          {loading && <p>Loading tutorials...</p>}
          {error && <p className="tutorial-list__error">{error}</p>}

          <div className="search-container">
            <input
                type="text"
                placeholder="Search tutorials..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
            />
          </div>

          <div className="tutorial-list">
            {currentTutorials.map((t) => (
                <div key={t._id} className="tutorial-card">
                  <h3
                      className="tutorial-card__title"
                      onClick={() => handleTutorialClick(t._id)}
                  >
                    {t.title}
                  </h3>
                  <p className="tutorial-card__category">{t.category}</p>
                  <p className="tutorial-card__author">
                    By {t.authorId?.username || "Unknown"}
                  </p>
                  <p className="tutorial-card__date">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </p>

                  <div className="tutorial-reactions-summary">
                    <AiFillLike className="reaction-icon blue" />
                    <AiFillHeart className="reaction-icon red" />
                    <span className="reaction-count">{likes[t._id]}</span>
                    <span className="comment-share-count">
                  {(comments[t._id] || []).length} 💬
                </span>
                  </div>

                  <div className="tutorial-card__actions">
                    <button
                        className={`action-button ${
                            likes[t._id] > 0 ? "liked" : ""
                        }`}
                        onClick={() => handleLike(t._id)}
                    >
                      <FaRegThumbsUp className="action-icon" />
                      <span>LIKE</span>
                    </button>
                    <button
                        className="action-button"
                        onClick={(e) => handleCommentSubmit(e, t._id)}
                    >
                      <FaRegCommentAlt className="action-icon" />
                      <span>Comment</span>
                    </button>
                    <button
                        className="action-button"
                        onClick={() => handleShareClick(t._id)}
                    >
                      <FaShare /> Share
                    </button>
                  </div>

                  <div className="tutorial-card__comments">
                    {(comments[t._id] || []).map((c) => (
                        <div key={c._id} className="tutorial-comment">
                          <p>{c.content}</p>
                          <p className="tutorial-comment__meta">
                            By {c.userId?.username || "Anonymous"} |{" "}
                            {new Date(c.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                    ))}
                    <textarea
                        value={commentContent[t._id] || ""}
                        onChange={(e) =>
                            handleCommentChange(t._id, e.target.value)
                        }
                        placeholder="Add a comment..."
                        className="tutorial-form__textarea"
                    />
                  </div>
                </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
              <div className="pagination">
                <button
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    disabled={currentPage === 1}
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i + 1}
                        className={currentPage === i + 1 ? "active" : ""}
                        onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                ))}
                <button
                    onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
          )}

          <button
              className="tutorial-button"
              onClick={() => navigate("/tutorials/create")}
          >
            Create New Tutorial
          </button>
          {shareModal.visible && (
              <ShareModal
                  url={shareModal.url}
                  onClose={() =>
                      setShareModal({ visible: false, url: "" })
                  }
              />
          )}
        </section>
      </>
  );
};

export default Tutorials;
