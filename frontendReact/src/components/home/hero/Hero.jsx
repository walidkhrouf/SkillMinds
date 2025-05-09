import Heading from "../../common/heading/Heading";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  const navigate = useNavigate();

  return (
      <>
        <section className="hero">
          <div className="container">
            <div className="row">
              <Heading
                  subtitle="WELCOME TO SkillMinds"
                  title="Best Online Education Expertise"
              />
              <p>
                Unlocking potential, fostering growth, and empowering success through continuous learning and skill development.
              </p>
              <div className="button-group">

                <button
                    className="secondary-btn"
                    onClick={() => navigate("/all-courses")}
                >
                  VIEW COURSE <i className="fa fa-long-arrow-alt-right"></i>
                </button>
              </div>
            </div>
          </div>
        </section>
        <div className="margin"></div>
      </>
  );
};

export default Hero;