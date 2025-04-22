const express = require('express');
const router = express.Router();
const multer = require('multer');
const Skill = require('../models/Skill');
const Course = require('../models/Course'); 

const { 
  createCourse, getAllCourses, getCourseById, updateCourse, 
  deleteCourse, enrollInCourse, updateProgress, getEnrollmentStatus,searchCourses,
  processPayment,rateCourse
} = require('../Controllers/CoursesController');

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 16 * 1024 * 1024 } }); 


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



router.get('/video/:courseId/:videoOrder', async (req, res) => {
    try {
      const { courseId, videoOrder } = req.params;
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ message: 'Course not found' });
  

      const adjustedOrder = parseInt(videoOrder) + 1;
      const video = course.videos.find(v => v.order === adjustedOrder);
      
      if (!video) return res.status(404).json({ message: 'Video not found' });
  
      res.setHeader('Content-Disposition', `attachment; filename="${video.filename}"`);
      res.setHeader('Content-Type', video.contentType);
      res.send(video.data);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

 
  
router.post('/', upload.array('videos'), createCourse); 
router.get('/', getAllCourses);
router.get('/:id', getCourseById);
router.put('/:id', upload.array('videos'), updateCourse);
router.delete('/:id', deleteCourse);
router.put('/progress/:enrollmentId', updateProgress);
router.get('/search', searchCourses);
router.post('/pay', processPayment);
router.post('/rate', rateCourse);

module.exports = router;