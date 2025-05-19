const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createJobOffer, getAllJobOffers, getJobOfferById, updateJobOffer, deleteJobOffer, createJobApplication, getAllJobApplications,updateApplicationStatus, getRecommendedJobsBySkills,updateInterviewDate,confirmInterviewStatus,getUserInterviewInvites,updateFinalDecision,generateDescription,generateCoverLetter,  getCitiesByCountry} = require('../Controllers/GestionRecruitementController');
const JobApplication = require('../models/JobApplication'); // Import the model
const JobOffer = require('../models/JobOffer');
const UserSkill = require('../models/UserSkill');


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
router.post('/cities', getCitiesByCountry);
router.put('/applications/:applicationId/status', updateApplicationStatus);
router.put('/applications/:id/interview-date', updateInterviewDate);
router.put('/applications/:id/interview-confirm', confirmInterviewStatus);
router.get('/interview-invites/:userId', getUserInterviewInvites);

router.put('/applications/:id/final-decision', updateFinalDecision);
router.post('/generate-description', generateDescription);
router.post('/generate-cover-letter', generateCoverLetter);





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


// 🎯 IA : Recommandation des jobs selon les skills de l'utilisateur
router.get('/recommended-jobs/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // 1. Récupérer les skills de l'utilisateur
    const userSkills = await UserSkill.find({ userId });
    const skillIds = userSkills.map(s => s.skillId.toString());

    if (!skillIds.length) {
      return res.status(200).json([]); // Aucun skill → pas de recommandation
    }

    // 2. Trouver les jobs avec au moins un skill requis en commun
    const recommendedJobs = await JobOffer.find({
      status: 'open',
      requiredSkills: { $in: skillIds }
    }).populate('postedBy', 'username');

    res.json(recommendedJobs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching recommended jobs' });
  }
});

module.exports = router;