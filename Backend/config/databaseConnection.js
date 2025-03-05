const mongoose = require('mongoose');
require('dotenv').config();

const models = require('../models'); 

const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/devminds_db';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = mongoose;
