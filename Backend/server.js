const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');


require('dotenv').config();

const app = express();

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devminds_db';
mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("******************************************");
  console.log(`Express server running on port ${PORT}`);
  console.log("******************************************");
});