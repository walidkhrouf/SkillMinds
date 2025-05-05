import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Back from "../common/back/Back";
import axios from "axios";
import "./groupStyles.css";

// Assuming Font Awesome is included in your project
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faEye, faTrash, faUsers, faSpinner } from "@fortawesome/free-solid-svg-icons";

const GroupPosts = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [groupName, setGroupName] = useState(""); // New state for group name
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const currentUserId = currentUser.id || currentUser._id;

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchPosts = async () => {
    const jwtToken = localStorage.getItem("jwtToken");
    try {
      const groupResponse = await axios.get(`http://localhost:5000/api/groups/all`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      const group = groupResponse.data.find((g) => g._id === groupId);
      setIsPrivate(group.privacy === "private");
      setGroupName(group.name); // Set group name

      const postsResponse = await axios.get(`http://localhost:5000/api/groups/posts/${groupId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setPosts(postsResponse.data);
      setIsMember(true);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts.");
      if (err.response?.status === 403) setIsMember(false);
      if (err.response?.status === 401) navigate("/signin");
      setLoading(false);
    }
  };

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      navigate("/signin");
      return;
    }
    fetchPosts();
    const interval = setInterval(fetchPosts, 5000);
    return () => clearInterval(interval);
  }, [groupId, navigate]);

  const handleAddPost = () => navigate(`/groups/${groupId}/post`);
  const handleViewPostDetails = (postId) => navigate(`/groups/${groupId}/posts/${postId}`);
  const handleRequestToJoin = () => navigate("/groups");

  const handleDeletePost = async (postId) => {
    const jwtToken = localStorage.getItem("jwtToken");
    try {
      await axios.delete(`http://localhost:5000/api/groups/posts/${groupId}/${postId}`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
      setToastMessage("Post has been deleted.");
    } catch (err) {
      setToastMessage(err.response?.data?.message || "Failed to delete post.");
    }
  };

  const filteredPosts = posts
      .filter((post) =>
          searchQuery
              ? post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              post.subject.toLowerCase().includes(searchQuery.toLowerCase())
              : true
      )
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
      });

  if (loading) {
    return (
        <div className="group-loading">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Loading posts...</p>
        </div>
    );
  }

  if (error) {
    return <p className="group-form__error">{error}</p>;
  }

  if (isPrivate && !isMember) {
    return (
        <>
          <Back title="Group Posts" />
          <section className="group-section">
            <div className="group-container">
              <div className="group-private-message">
                <FontAwesomeIcon icon={faUsers} size="3x" className="group-private-icon" />
                <h2>Private Group</h2>
                <p>This is a private group. Join to view posts and participate!</p>
                <button
                    className="group-button group-join-button"
                    onClick={handleRequestToJoin}
                    title="Request to join this group"
                >
                  <FontAwesomeIcon icon={faUsers} /> Request to Join
                </button>
              </div>
            </div>
          </section>
          {toastMessage && <div className="toast-message">{toastMessage}</div>}
        </>
    );
  }

  return (
      <>
        <Back title="Group Posts" />
        <section className="group-section">
          <div className="group-container">
            <header className="group-header">
              <h1 className="group-header__title">{groupName || "Group Posts"}</h1>
            </header>
            <div className="group-controls">
              <input
                  type="text"
                  placeholder="Search posts by title or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="group-search__input"
                  title="Search posts"
              />
              <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="group-filter__select"
                  title="Sort posts"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
              <button
                  className="group-button group-action-button"
                  onClick={handleAddPost}
                  title="Create a new post"
              >
                <FontAwesomeIcon icon={faPlus} /> Add Post
              </button>
            </div>
            <div className="group-grid">
              {filteredPosts.length === 0 ? (
                  <p className="group-no-content">
                    {searchQuery ? "No posts match your search." : "No posts yet. Be the first to post!"}
                  </p>
              ) : (
                  filteredPosts.map((post, index) => (
                      <div
                          className="group-card"
                          key={post._id}
                          style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="group-card__content">
                          <h3 className="group-card__title">{post.title}</h3>
                          <p className="group-card__description">{post.subject.substring(0, 100)}</p>
                          <span className="group-card__meta">
                      Posted by: <label>{post.userId?.username || "Unknown"}</label>
                    </span>
                          <span className="group-card__meta">
                      Created: <label>{new Date(post.createdAt).toLocaleString()}</label>
                    </span>
                          <div className="group-card__actions">
                            <button
                                className="group-button group-view-button"
                                onClick={() => handleViewPostDetails(post._id)}
                                title="View post details"
                            >
                              <FontAwesomeIcon icon={faEye} /> View Details
                            </button>
                            {post.userId?._id === currentUserId && (
                                <button
                                    className="group-button group-card__delete-btn"
                                    onClick={() => handleDeletePost(post._id)}
                                    title="Delete this post"
                                >
                                  <FontAwesomeIcon icon={faTrash} /> Delete Post
                                </button>
                            )}
                          </div>
                        </div>
                      </div>
                  ))
              )}
            </div>
          </div>
        </section>
        {toastMessage && <div className="toast-message">{toastMessage}</div>}
      </>
  );
};

export default GroupPosts;