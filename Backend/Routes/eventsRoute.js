const express = require('express');
const router = express.Router();
const { createActivity, getActivities, getActivityById, updateActivity, deleteActivity } = require('../Controllers/eventsController');
const multer = require('multer');
const path = require('path');

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Create a new activity (with file upload)
router.post('/', upload.single('eventImage'), createActivity);

// Get all activities
router.get('/', getActivities);

// Get a specific activity by ID
router.get('/:id', getActivityById);

// Update an activity by ID (with optional file upload)
router.put('/:id', upload.single('eventImage'), updateActivity);

// Delete an activity by ID
router.delete('/:id', deleteActivity);

module.exports = router;