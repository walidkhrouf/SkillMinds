const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createJobOffer, getAllJobOffers, getJobOfferById, updateJobOffer, deleteJobOffer, createJobApplication, getAllJobApplications } = require('../Controllers/GestionRecruitementController');
const JobApplication = require('../models/JobApplication'); // Import the model
// Multer setup for in-memory storage
const storage = multer.memoryStorage(); // Store file in memory, not on disk
const upload = multer({ storage });

// Routes
router.post('/job-offers', createJobOffer);
router.get('/job-offers/:id', getJobOfferById);
router.get('/job-offers', getAllJobOffers);
router.put('/job-offers/:id', updateJobOffer);
router.delete('/job-offers/:id', deleteJobOffer);
router.post('/job-applications', upload.single('resume'), createJobApplication);
router.get('/job-applications', getAllJobApplications);

// Route to download CV files (updated to serve from MongoDB)
router.get('/cv/download/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const application = await JobApplication.findOne({ applicationId });
    if (!application || !application.resume || !application.resume.data) {
      return res.status(404).json({ message: 'CV not found' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${application.resume.filename}"`);
    res.setHeader('Content-Type', application.resume.contentType);
    res.send(application.resume.data); // Send the binary data directly
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;