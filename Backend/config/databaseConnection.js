// databaseconnection.js
const mongoose = require('mongoose');
require('dotenv').config();

// Import all your models from the models folder's index.js file
const models = require('../models'); // Adjust the path if necessary

const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/devminds_db';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(async () => {
    console.log('MongoDB connected');

    // Loop through each model and force collection creation
    for (const modelName in models) {
      if (Object.hasOwnProperty.call(models, modelName)) {
        try {
          await models[modelName].createCollection();
          console.log(`Collection for ${modelName} created (or already exists)`);
        } catch (err) {
          console.error(`Error creating collection for ${modelName} using createCollection():`, err);
          // Fallback: insert a dummy document then remove it
          try {
            console.log(`Attempting fallback for ${modelName}: inserting dummy document`);
            const dummyDoc = await models[modelName].create({});
            await models[modelName].deleteOne({ _id: dummyDoc._id });
            console.log(`Fallback: Dummy document inserted and removed for ${modelName} - collection should now exist`);
          } catch (fallbackErr) {
            console.error(`Fallback failed for ${modelName}:`, fallbackErr);
          }
        }
      }
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

module.exports = mongoose;
