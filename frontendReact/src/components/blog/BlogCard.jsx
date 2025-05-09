// BlogCard.jsx
import { blog } from "../../dummydata";
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection

const BlogCard = () => {
  const navigate = useNavigate(); // Hook for navigation

  return (
    <>
      {blog.map((val, index) => (
        <div className="items shadow" key={index}>
          <div className="img">
            <img src={val.cover} alt="" />
          </div>
          <div className="text">
            <div className="admin flexSB">
              <span>
                <i className="fa fa-user"></i>
                <label htmlFor="">{val.type}</label>
              </span>
              <span>
                <i className="fa fa-calendar-alt"></i>
                <label htmlFor="">{val.date}</label>
              </span>
              <span>
                <i className="fa fa-comments"></i>
                <label htmlFor="">{val.com}</label>
              </span>
            </div>
            <h1>{val.title}</h1>
            <p>{val.desc}</p>
          </div>
        </div>
      ))}
      {/* New Explore More Groups Card */}
      <div className="items shadow">
        <div className="text" style={{ textAlign: "center", padding: "40px 30px" }}>
          <h1>Discover Communities</h1>
          <p>Join groups to connect with others!</p>
          <button
            onClick={() => navigate("/groups")}
            style={{
              padding: "10px 20px",
              backgroundColor: "#a47f18",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            Explore More Groups
          </button>
        </div>
      </div>
    </>
  );
};

export default BlogCard;