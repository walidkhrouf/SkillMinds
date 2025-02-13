const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

// **Important:** Require your database connection so that collections are forced to create.
require('./config/databaseConnection');

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// All your routes go here
// e.g., app.use('/api/users', require('./routes/users'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("******************************************");
  console.log(`Express server running on port ${PORT}`);
  console.log("******************************************");
});
