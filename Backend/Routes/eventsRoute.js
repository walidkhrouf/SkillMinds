const express = require('express');
const router = express.Router();
const eventsController = require('../Controllers/eventsController');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

router.post('/', upload.single('eventImage'), eventsController.createActivity);
router.get('/recommend', eventsController.recommendActivities);
router.get('/category-stats', eventsController.getActivityCategoryStats);
router.get('/trending', eventsController.getTrendingActivities);
router.get('/', eventsController.getActivities);
router.post('/generate-image', eventsController.generateAIImage);
router.get('/:id', eventsController.getActivityById);
router.put('/:id', upload.single('eventImage'), eventsController.updateActivity);
router.delete('/:id', eventsController.deleteActivity);
router.post('/:id/confirm-payment', eventsController.confirmPayment);
router.post('/:id/participate', eventsController.participateInActivity);
router.post('/:id/rate', eventsController.submitRating);
router.get('/:id/rating', eventsController.getUserRating);
router.get('/:id/ratings', eventsController.getActivityRatings);
router.post('/:id/comment', eventsController.submitComment);
router.get('/:id/comments', eventsController.getActivityComments);
router.put('/:id/comment/:commentId', eventsController.updateComment);
router.delete('/:id/comment/:commentId', eventsController.deleteComment);
module.exports = router;