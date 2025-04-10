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

  const navigate = useNavigate();
  const userId = JSON.parse(localStorage.getItem("currentUser") || "{}")._id || "";

  useEffect(() => {
    const fetchTutorials = async () => {
      setLoading(true);
      try {
        const response = await axios.get("http://localhost:5000/api/tutorials");
        setTutorials(response.data);
        setFilteredTutorials(response.data);

        const initialComments = {};
        const initialLikes = {};
        const initialCommentContent = {};

        response.data.forEach((tutorial) => {
          initialComments[tutorial.tutorialId] = tutorial.comments || [];
          initialLikes[tutorial.tutorialId] = tutorial.likes || 0;
          initialCommentContent[tutorial.tutorialId] = "";
        });

        setComments(initialComments);
        setLikes(initialLikes);
        setCommentContent(initialCommentContent);
      } catch (err) {
        setError("Failed to load tutorials");
      } finally {
        setLoading(false);
      }
    };
    fetchTutorials();
  }, []);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value === "") {
      setFilteredTutorials(tutorials);
    } else {
      const filtered = tutorials.filter(
        (tutorial) =>
          tutorial.title.toLowerCase().includes(e.target.value.toLowerCase()) ||
          tutorial.category.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setFilteredTutorials(filtered);
    }
  };

  const handleTutorialClick = (tutorialId) => {
    navigate(`/tutorials/${tutorialId}`);
  };

  const handleLike = async (tutorialId) => {
    try {
      const response = await axios.post(
        `http://localhost:5000/api/tutorials/${tutorialId}/like`,
        { userId }
      );
      setLikes((prevLikes) => ({
        ...prevLikes,
        [tutorialId]:
          response.data.message === "Like removed"
            ? prevLikes[tutorialId] - 1
            : prevLikes[tutorialId] + 1,
      }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to like tutorial");
    }
  };

  // Fonction de vérification des mots offensants avec l'API RapidAPI
  const checkForBadWords = async (comment) => {
    const apiKey = "97b6f4bf49msh5e3c302c88403e5p14d202jsnfcd1ea32122a"; // Ton API Key de RapidAPI
    const badWordsAPI = "https://neutrinoapi-bad-word-filter.p.rapidapi.com/bad-word-filter";
    
    const encodedParams = new URLSearchParams();
    encodedParams.set('content', comment);
    encodedParams.set('censor-character', '*');

    const options = {
      method: 'POST',
      url: badWordsAPI,
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': 'neutrinoapi-bad-word-filter.p.rapidapi.com',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: encodedParams,
    };

    try {
      const response = await axios.request(options);
      const data = response.data;

      if (data.censored) {
        return true; // Si censured est true, le commentaire contient des mots offensants
      }
      return false; // Si censured est false, le commentaire est propre
    } catch (error) {
      console.error("Erreur lors de la vérification des mots : ", error);
      return false; // En cas d'erreur, considérer comme sans mots offensants
    }
  };

  const handleCommentSubmit = async (e, tutorialId) => {
    e.preventDefault();

    if (!commentContent[tutorialId].trim()) return;

    // Vérification des mots offensants dans le commentaire
    const isSafe = await checkForBadWords(commentContent[tutorialId]);
    if (isSafe) {
      alert("Votre commentaire contient un langage inapproprié.");
      return;
    }

    try {
      const response = await axios.post(
        `http://localhost:5000/api/tutorials/${tutorialId}/comment`,
        { content: commentContent[tutorialId], userId }
      );
      setComments((prevComments) => ({
        ...prevComments,
        [tutorialId]: [...prevComments[tutorialId], response.data.comment],
      }));
      setCommentContent((prevContent) => ({ ...prevContent, [tutorialId]: "" }));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add comment");
    }
  };

  const handleCommentChange = (tutorialId, value) => {
    setCommentContent((prevContent) => ({ ...prevContent, [tutorialId]: value }));
  };

  const handleShareClick = (tutorialId) => {
    const url = `${window.location.origin}/tutorials/${tutorialId}`;
    setShareModal({ visible: true, url });
  };

  const ShareModal = ({ url, onClose }) => (
    <div className="share-modal-overlay">
      <div className="share-modal">
        <h3>Share this Tutorial</h3>
        <div className="share-buttons">
          <button
            onClick={() =>
              window.open(
                `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
                "_blank"
              )
            }
            className="share-button facebook"
          >
            <FaFacebook /> Facebook
          </button>
          <button
            onClick={() =>
              window.open(`https://www.instagram.com/?url=${encodeURIComponent(url)}`, "_blank")
            }
            className="share-button instagram"
          >
            <FaInstagram /> Instagram
          </button>
          <button
            onClick={() =>
              (window.location.href = `mailto:?subject=Check%20this%20tutorial&body=${encodeURIComponent(url)}`) 
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
          {filteredTutorials.map((tutorial) => (
            <div key={tutorial.tutorialId} className="tutorial-card">
              <h3
                className="tutorial-card__title"
                onClick={() => handleTutorialClick(tutorial.tutorialId)}
              >
                {tutorial.title}
              </h3>
              <p className="tutorial-card__category">{tutorial.category}</p>
              <p className="tutorial-card__author">
                By {tutorial.authorId?.username || "Unknown"}
              </p>
              <p className="tutorial-card__date">
                {new Date(tutorial.createdAt).toLocaleDateString()}
              </p>

              <div className="tutorial-reactions-summary">
                <AiFillLike className="reaction-icon blue" />
                <AiFillHeart className="reaction-icon red" />
                <span className="reaction-count">{likes[tutorial.tutorialId]}</span>
                <span className="comment-share-count">
                  {(comments[tutorial.tutorialId] || []).length} 💬
                </span>
              </div>

              <div className="tutorial-card__actions">
                <button
                  className={`action-button ${likes[tutorial.tutorialId] > 0 ? "liked" : ""}`}
                  onClick={() => handleLike(tutorial.tutorialId)}
                >
                  <FaRegThumbsUp className="action-icon" />
                  <span>LIKE</span>
                </button>

                <button
                  className="action-button"
                  onClick={(e) => handleCommentSubmit(e, tutorial.tutorialId)}
                >
                  <FaRegCommentAlt className="action-icon" />
                  <span>Comment</span>
                </button>

                <button className="action-button" onClick={() => handleShareClick(tutorial.tutorialId)}>
                  <FaShare /> Share
                </button>
              </div>

              <div className="tutorial-card__comments">
                {(comments[tutorial.tutorialId] || []).map((comment) => (
                  <div key={comment._id} className="tutorial-comment">
                    <p>{comment.content}</p>
                    <p className="tutorial-comment__meta">
                      By {comment.userId?.username || "Anonymous"} |{" "}
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}

                <textarea
                  value={commentContent[tutorial.tutorialId]}
                  onChange={(e) => handleCommentChange(tutorial.tutorialId, e.target.value)}
                  placeholder="Add a comment..."
                  className="tutorial-form__textarea"
                />
              </div>
            </div>
          ))}
        </div>

        <button className="tutorial-button" onClick={() => navigate("/tutorials/create")}>
          Create New Tutorial
        </button>
        {shareModal.visible && (
          <ShareModal url={shareModal.url} onClose={() => setShareModal({ visible: false, url: "" })} />
        )}
      </section>
    </>
  );
};

export default Tutorials;
