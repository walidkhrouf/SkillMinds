import React from 'react';
import { useNavigate } from 'react-router-dom';
import './courses.css';
import { coursesCard } from '../../dummydata';

const CoursesCard = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  return (
    <section className="coursesCard">
      <div className="container grid2">
        {coursesCard.map((val) => (
          <div className="items" key={val.id}>
            <div className="content flex">
              <div className="left">
                <div className="img">
                  <img src={val.cover} alt={val.coursesName} />
                </div>
              </div>
              <div className="text">
                <h1>{val.coursesName}</h1>
                <div className="rate">
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <i className="fa fa-star"></i>
                  <label>(5.0)</label>
                </div>
                <div className="details">
                  {val.courTeacher.map((details, index) => (
                    <React.Fragment key={index}>
                      <div className="box">
                        <div className="dimg">
                          <img src={details.dcover} alt={details.name} />
                        </div>
                        <div className="para">
                          <h4>{details.name}</h4>
                        </div>
                      </div>
                      <span>{details.totalTime}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
            <div className="price">
              <h3>
                {val.priceAll} / {val.pricePer}
              </h3>
            </div>
            <button className="outline-btn">ENROLL NOW !</button>
          </div>
        ))}
      </div>
      <div className="courses-actions">
        <button
          onClick={() => navigate('/all-courses')}
          className="explore-btn outline-btn"
        >
          EXPLORE MORE COURSES
        </button>
        {currentUser._id && (
          <button
            onClick={() => navigate('/create-course')}
            className="add-btn outline-btn"
          >
            ADD COURSES
          </button>
        )}
      </div>
    </section>
  );
};

export default CoursesCard;