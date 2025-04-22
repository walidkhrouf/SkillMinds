const Course = require('../models/Course');
const CourseEnrollment = require('../models/CourseEnrollment');
const Notification = require('../models/Notification');
const stripe = require('stripe')('sk_test_51R2GwyQngl8IiP8f3MWeqLc9Oda9IHDLXUEm52Idjtz9GII5a3popsdhV3JM2xUMqfgglLS4chQoi6F3b05J5Bgt00ibNqQOjz');


const createCourse = async (req, res) => {
  try {
    const { title, description, skillId, price } = req.body;
    const createdBy = req.body.userId; 
    const videoFiles = req.files; 

    if (!title || !skillId || !createdBy || !videoFiles || videoFiles.length === 0) {
      return res.status(400).json({ message: 'Title, skillId, createdBy, and at least one video are required' });
    }

    const videos = videoFiles.map((file, index) => ({
      data: file.buffer,
      filename: file.originalname,
      contentType: file.mimetype,
      length: file.size,
      order: index + 1 
    }));

    const newCourse = new Course({ title, description, skillId, createdBy, price, videos });
    await newCourse.save();

    const notification = new Notification({
      userId: createdBy,
      type: 'COURSE_ENROLLMENT', 
      message: `Your course "${title}" has been created successfully.`
    });
    await notification.save();

    res.status(201).json(newCourse);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: error.message });
  }
};

const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('skillId', 'name').populate('createdBy', 'username');
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id).populate('skillId', 'name').populate('createdBy', 'username');
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const currentUserId = req.query.userId;
    if (course.createdBy._id.toString() === currentUserId) {
      const enrollments = await CourseEnrollment.find({ courseId: id }).populate('userId', 'username email');
      return res.status(200).json({ course, enrollments });
    }

    res.status(200).json({ course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, skillId, price } = req.body;
    const currentUserId = req.body.userId;
    const videoFiles = req.files || [];

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ message: 'You can only update your own courses' });
    }

    const videos = videoFiles.length > 0
      ? videoFiles.map((file, index) => ({
          data: file.buffer,
          filename: file.originalname,
          contentType: file.mimetype,
          length: file.size,
          order: index + 1
        }))
      : course.videos; 

    const updatedCourse = await Course.findByIdAndUpdate(
      id,
      { title, description, skillId, price, videos },
      { new: true }
    ).populate('skillId', 'name').populate('createdBy', 'username');

    res.status(200).json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.query.userId;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (course.createdBy.toString() !== currentUserId) {
      return res.status(403).json({ message: 'You can only delete your own courses' });
    }

    await Course.findByIdAndDelete(id);
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const enrollInCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.body.userId;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const existingEnrollment = await CourseEnrollment.findOne({ userId, courseId });
    if (existingEnrollment) return res.status(400).json({ message: 'Already enrolled in this course' });

    const enrollment = new CourseEnrollment({ userId, courseId });
    await enrollment.save();

    const notification = new Notification({
      userId,
      type: 'COURSE_ENROLLMENT',
      message: `You have enrolled in "${course.title}".`
    });
    await notification.save();

    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getEnrollmentStatus = async (req, res) => {
  try {
    const { userId, courseId } = req.query;
    
    if (!userId || !courseId) {
      return res.status(400).json({ message: 'userId and courseId are required' });
    }

    const enrollment = await CourseEnrollment.findOne({ 
      userId, 
      courseId 
    });
    
    if (!enrollment) {
      return res.status(404).json({ message: 'Not enrolled in this course' });
    }
    
    res.status(200).json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProgress = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { videoOrder } = req.body; 
    const userId = req.body.userId;

    const enrollment = await CourseEnrollment.findOne({ enrollmentId, userId });
    if (!enrollment) return res.status(404).json({ message: 'Enrollment not found or not yours' });

    const course = await Course.findById(enrollment.courseId);
    const totalVideos = course.videos.length;
    const progressPerVideo = 100 / totalVideos;
    const newProgress = Math.min(progressPerVideo * videoOrder, 100);

    enrollment.progress = newProgress;
    if (newProgress === 100) {
      enrollment.status = 'completed';
      enrollment.completedAt = new Date();

      const completionNotification = new Notification({
        userId,
        type: 'COURSE_COMPLETION',
        message: `You have completed the course "${course.title}".`
      });
      await completionNotification.save();
    } else {
      enrollment.status = 'in-progress';
    }

    await enrollment.save();
    res.status(200).json(enrollment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const searchCourses = async (req, res) => {
  try {
    const query = req.query.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const courses = await Course.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    })
    .populate('createdBy', 'username email')
    .populate('skillId', 'name');

    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processPayment = async (req, res) => {
  const { courseId, token, userId } = req.body;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.price > 0) {
      const charge = await stripe.charges.create({
        amount: course.price * 100,
        currency: 'usd',
        source: token,
        description: `Payment for course: ${course.name}`,
        metadata: {
          courseId: course.id,
          userId: userId
        }
      });

      res.status(200).json({
        success: true,
        message: 'Payment successful',
        charge
      });
    } else {
      res.status(400).json({ message: 'Invalid price for course' });
    }
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ message: 'Payment failed', error: error.message });
  }
};

const rateCourse = async (req, res) => {
  try {
    const { courseId, userId, rating } = req.body;

    if (!courseId || !userId || !rating) {
      return res.status(400).json({ message: 'courseId, userId et rating sont requis.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'La note doit être entre 1 et 5.' });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Cours non trouvé.' });
    }

    const existingRating = course.ratings.find(r => r.userId.toString() === userId);
    if (existingRating) {
      existingRating.rating = rating; // mise à jour
    } else {
      course.ratings.push({ userId, rating }); // nouvelle note
    }

    await course.save();

    const total = course.ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = total / course.ratings.length;

    res.status(200).json({
      message: 'Note enregistrée.',
      averageRating: averageRating.toFixed(2),
      totalRatings: course.ratings.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};



module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  updateProgress,
  getEnrollmentStatus,
  searchCourses,
  processPayment,
  rateCourse
};