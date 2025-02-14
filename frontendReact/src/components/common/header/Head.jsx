import { Link } from 'react-router-dom';

const Head = () => {
  return (
    <section className="head">
      <div className="container flexSB">
        <Link to="/" className="logo">
          <img src="/images/logo.png" alt="Online Education & Learning Logo" />
          <span style={{ color: "#a47f18" }}> <br />
            ONLINE EDUCATION & LEARNING
          </span>
        
        </Link>
        <div className="social">
          <i className="fab fa-facebook-f icon"></i>
          <i className="fab fa-instagram icon"></i>
          <i className="fab fa-twitter icon"></i>
          <i className="fab fa-youtube icon"></i>
        </div>
      </div>
    </section>
  );
};

export default Head;
