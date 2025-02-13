

const Head = () => {
  return (
    <>
      <section className='head'>
        <div className='container flexSB'>
          <div className='logo'>
            <img src="/images/logo.png" alt="Online Education & Learning Logo"  /> <br />
            <span style={{ color: "#a47f18" }}>ONLINE EDUCATION & LEARNING</span>
          </div>

          <div className='social'>
            <i className='fab fa-facebook-f icon'></i>
            <i className='fab fa-instagram icon'></i>
            <i className='fab fa-twitter icon'></i>
            <i className='fab fa-youtube icon'></i>
          </div>
        </div>
      </section>
    </>
  );
};

export default Head;