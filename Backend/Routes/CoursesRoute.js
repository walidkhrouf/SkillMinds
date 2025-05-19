const express = require('express');
const router = express.Router();
const multer = require('multer');
const Skill = require('../models/Skill');
const Course = require('../models/Course');

const { 
  createCourse, getAllCourses, getCourseById, updateCourse, 
  deleteCourse, enrollInCourse, getEnrollmentStatus, searchCourses,
  processPayment, rateCourse, getVideo, createComment, getComments,
  createDiscussionMessage, getDiscussionMessages, generateQuizCertificate, 
  generateQuiz, generateCourseDescription
} = require('../Controllers/CoursesController');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 16 * 1024 * 1024 } });

// Middleware d'authentification
const authenticate = (req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  console.log('Authenticate Middleware - userId:', userId, 'Query:', req.query, 'Body:', req.body); // Debug logging
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  // TODO: Implement JWT validation for enhanced security
  next();
};

router.get('/skills', async (req, res) => {
  try {
    const skills = await Skill.find();
    res.status(200).json(skills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/enroll', getEnrollmentStatus);
router.post('/enroll', authenticate, enrollInCourse);
router.get('/video/:courseId/:videoOrder', authenticate, getVideo);
router.post('/', authenticate, upload.array('videos'), createCourse);
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.put('/:id', authenticate, upload.array('videos'), updateCourse);
router.delete('/:id', authenticate, deleteCourse);
router.get('/search', searchCourses);
router.post('/pay', authenticate, processPayment);
router.post('/rate', authenticate, rateCourse);
router.post('/comments/create', authenticate, createComment);
router.get('/comments/list', getComments);
router.post('/discussion/create', authenticate, createDiscussionMessage);
router.get('/discussion/list', authenticate, getDiscussionMessages);
router.post('/quiz-certificate', authenticate, generateQuizCertificate);
router.get('/quiz/:courseId', authenticate, generateQuiz);
router.post('/generate-description', authenticate, generateCourseDescription);

module.exports = router;