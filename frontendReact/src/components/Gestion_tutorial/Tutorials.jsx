import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { FaSort } from "react-icons/fa";
import Back from "../common/back/Back";


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
  const [sortType, setSortType] = useState("title-asc");
  const [currentPage, setCurrentPage] = useState(1); // Track current page
  const [itemsPerPage, setItemsPerPage] = useState(2); // Number of tutorials per page
  const navigate = useNavigate();
  const [shareModal, setShareModal] = useState({ visible: false, url: "" });

  // 🔄 Initial load
  useEffect(() => {
    const fetchTutorials = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get("http://localhost:5000/api/tutorials");
        setTutorials(data);
        setFilteredTutorials(data);
      } catch {
        setError("Failed to load tutorials");
      } finally {
        setLoading(false);
      }
    };
    fetchTutorials();
  }, []);

  // Apply search + sort
  const applyFilters = (term, sort) => {
    let list = tutorials;

    // 🔍 Filtering
    if (term) {
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(term.toLowerCase()) ||
          t.category.toLowerCase().includes(term.toLowerCase())
      );
    }

    // ↕️ Sorting
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "title-asc":
          return a.title.localeCompare(b.title);
        case "title-desc":
          return b.title.localeCompare(a.title);
        case "date-desc":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "date-asc":
          return new Date(a.createdAt) - new Date(b.createdAt);
        default:
          return 0;
      }
    });

    setFilteredTutorials(list);
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Handle next and previous page
  const handleNextPage = () => {
    if (currentPage < Math.ceil(filteredTutorials.length / itemsPerPage)) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Slice tutorials for current page
  const indexOfLastTutorial = currentPage * itemsPerPage;
  const indexOfFirstTutorial = indexOfLastTutorial - itemsPerPage;
  const currentTutorials = filteredTutorials.slice(indexOfFirstTutorial, indexOfLastTutorial);

  // On search change
  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    applyFilters(term, sortType);
  };

  // On sort change
  const handleSortChange = (e) => {
    const sort = e.target.value;
    setSortType(sort);
    applyFilters(searchTerm, sort);
  };

  const handleTutorialClick = (id) => {
    navigate(`/tutorials/${id}`);
  };

  return (
    <>
      <Back title="Tutorials" />

      <section className="tutorial-section">
            <h2 className="tutorial-list__title">All Tutorials</h2>

  <div className="tutorial-header">
    <button
      className="tutorial-button"
      onClick={() => navigate("/tutorials/create")}
    >
      Create Tutorial
    </button>
  </div>

  {loading && <p>Loading...</p>}
  {error && <p className="tutorial-list__error">{error}</p>}

  {/* Recherche + Tri */}
  <div className="search-container">
    <div className="search-wrapper">
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleSearch}
        className="search-input"
      />
    </div>
    <div className="sort-wrapper">
      <label htmlFor="sort-select" className="sort-label">
        <FaSort className="sort-icon" />
      </label>
      <select
        id="sort-select"
        value={sortType}
        onChange={handleSortChange}
        className="sort-select"
      >
        <option value="title-asc">Title A → Z</option>
        <option value="title-desc">Title Z → A</option>
        <option value="date-desc">Newest first</option>
        <option value="date-asc">Oldest first</option>
      </select>
    </div>
  </div>

  {/* Carte des tutoriels */}
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
        <div className="tutorial-card__actions">
          <button
            className="tutorial-card__button"
            onClick={() => handleTutorialClick(t._id)}
          >
            View Details
          </button>
        </div>
      </div>
    ))}
  </div>

  {/* Pagination */}
  <div className="pagination">
    <button
      className="page-arrow"
      onClick={handlePrevPage}
      disabled={currentPage === 1}
    >
      &lt;
    </button>
    {Array.from({
      length: Math.ceil(filteredTutorials.length / itemsPerPage),
    }).map((_, index) => (
      <button
        key={index}
        className={`page-button ${index + 1 === currentPage ? "active" : ""}`}
        onClick={() => handlePageChange(index + 1)}
        disabled={index + 1 === currentPage}
      >
        {index + 1}
      </button>
    ))}
    <button
      className="page-arrow"
      onClick={handleNextPage}
      disabled={currentPage === Math.ceil(filteredTutorials.length / itemsPerPage)}
    >
      &gt;
    </button>
  </div>
</section>

    </>
  );
};

export default Tutorials;
