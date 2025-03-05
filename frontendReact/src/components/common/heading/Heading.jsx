import PropTypes from 'prop-types';

const Heading = ({ subtitle, title }) => {
  return (
    <div id="heading">
      <h3>{subtitle}</h3>
      <h1>{title}</h1>
    </div>
  );
};

Heading.propTypes = {
  subtitle: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

export default Heading;
