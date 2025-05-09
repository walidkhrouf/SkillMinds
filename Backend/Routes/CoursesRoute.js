const express = require('express');
const router = express.Router();
const multer = require('multer');
const Skill = require('../models/Skill');
const Course = require('../models/Course');

const { 
  createCourse, getAllCourses, getCourseById, updateCourse, 
  deleteCourse, enrollInCourse, getEnrollmentStatus, searchCourses,
  processPayment, rateCourse, getVideo, createComment, getComments,
  createDiscussionMessage, getDiscussionMessages, generateQuizCertificate, generateQuiz
} = require('../Controllers/CoursesController');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 16 * 1024 * 1024 } });

// Middleware d'authentification
const authenticate = (req, res, next) => {
  const userId = req.query.userId || req.body.userId;
  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  // TODO: Ajoutez ici une vérification supplémentaire pour valider userId (par exemple, via JWT)
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
router.post('/enroll', enrollInCourse);
router.get('/video/:courseId/:videoOrder', authenticate, getVideo);
router.post('/', upload.array('videos'), createCourse);
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.put('/:id', upload.array('videos'), updateCourse);
router.delete('/:id', deleteCourse);
router.get('/search', searchCourses);
router.post('/pay', processPayment);
router.post('/rate', rateCourse);
router.post('/comments/create', authenticate, createComment);
router.get('/comments/list', getComments);
router.post('/discussion/create', createDiscussionMessage);
router.get('/discussion/list', getDiscussionMessages);
router.post('/quiz-certificate', authenticate, generateQuizCertificate);
router.get('/quiz/:courseId', generateQuiz);

module.exports = router;