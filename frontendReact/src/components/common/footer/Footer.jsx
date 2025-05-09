import { blog } from "../../../dummydata"
import "./footer.css"
import { NavLink, Link } from "react-router-dom"; // Import NavLink

const Footer = () => {
    return (
        <>

            <footer>
                <div className='container padding'>
                    <div className='box logo'>
                        <Link to="/" className="logo"> {/* Use Link for logo */}
                            <img src="/images/logo.png" alt="Logo" />
                        </Link>
                        <p>A small river named Duden flows by their place and supplies it with the necessary regelialia.</p>

                        <i className='fab fa-facebook-f icon'></i>
                        <i className='fab fa-twitter icon'></i>
                        <i className='fab fa-instagram icon'></i>
                    </div>
                    <div className='box link'>
                        <h3>Explore</h3>
                        <ul>
                            <li><NavLink to="/about">About Us</NavLink></li> {/* Use NavLink for navigation */}
                            <li><NavLink to="/services">Services</NavLink></li>
                            <li><NavLink to="/courses">All Courses</NavLink></li>
                            <li><NavLink to="/blog">Recruitement</NavLink></li>
                            <li><NavLink to="/contact">Contact us</NavLink></li>
                        </ul>
                    </div>
                    <div className='box link'>
                        <h3>Quick Links</h3>
                        <ul>
                            <li><NavLink to="/contact">Contact Us</NavLink></li>
                            <li><NavLink to="/pricing">Pricing</NavLink></li>
                            <li><NavLink to="/terms">Terms & Conditions</NavLink></li>
                            <li><NavLink to="/privacy">Privacy</NavLink></li>
                            <li><NavLink to="/feedbacks">Feedbacks</NavLink></li>
                        </ul>
                    </div>
                    <div className='box'>
                        <h3>Recent Post</h3>
                        {blog.slice(0, 3).map((val, index) => (
                            <div className='items flexSB' key={index}>
                                <div className='img'>
                                    <img src={val.cover} alt='' />
                                </div>
                                <div className='text'>
                                    <span>
                                        <i className='fa fa-calendar-alt'></i>
                                        <label>{val.date}</label>
                                    </span>
                                    <span>
                                        <i className='fa fa-user'></i>
                                        <label>{val.type}</label>
                                    </span>
                                    <h4>{val.title.slice(0, 40)}...</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className='box last'>
                        <h3>Have a Questions?</h3>
                        <ul>
                            <li>
                                <i className='fa fa-map'></i>
                                Tunisia, Ariana essoughra
                            </li>
                            <li>
                                <i className='fa fa-phone-alt'></i>
                                +216 50959791
                            </li>
                            <li>
                                <i className='fa fa-paper-plane'></i>
                                skillminds.team@gmail.com

                            </li>
                        </ul>
                    </div>
                </div>
                
            </footer>
            <div className='legal'>
        <p>
          Copyright ©2025 All rights reserved{" "}
          <i className='fa fa-heart'></i> by SkillMinds
        </p>
      </div>

        </>
    )
}

export default Footer