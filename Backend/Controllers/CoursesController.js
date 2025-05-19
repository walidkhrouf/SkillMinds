const Course = require('../models/Course');
const Comment = require('../models/Comment');
const CourseEnrollment = require('../models/CourseEnrollment');
const Notification = require('../models/Notification');
const DiscussionMessage = require('../models/DiscussionMessage');
const stripe = require('stripe')('sk_test_51R2GwyQngl8IiP8f3MWeqLc9Oda9IHDLXUEm52Idjtz9GII5a3popsdhV3JM2xUMqfgglLS4chQoi6F3b05J5Bgt00ibNqQOjz');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-email-password'
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test Nodemailer configuration
transporter.verify((error, success) => {
  if (error) {
    console.error('Nodemailer configuration error:', error);
  } else {
    console.log('Nodemailer is ready to send emails');
  }
});

// Configuration de Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not defined in environment variables');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
      const enrollments = await CourseEnrollment.find({ courseId: id }).populate('userId', 'username email').select('-progress');
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
    console.error('Error updating course:', error);
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
    console.error('Error deleting course:', error);
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
    console.error('Error enrolling in course:', error);
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
    
    res.status(200).json({ enrolled: true });
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    res.status(500).json({ message: error.message });
  }
};

const generateQuizCertificate = async (req, res) => {
  try {
    const { courseId, userId } = req.body;

    if (!courseId || !userId) {
      console.error('Missing courseId or userId:', { courseId, userId });
      return res.status(400).json({ message: 'courseId and userId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId) || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid courseId or userId format:', { courseId, userId });
      return res.status(400).json({ message: 'Invalid courseId or userId format' });
    }

    const course = await Course.findById(courseId)
      .populate('createdBy', 'username')
      .populate('skillId', 'name');
    if (!course) {
      console.error('Course not found:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }

    const enrollment = await CourseEnrollment.findOne({ userId, courseId })
      .populate('userId', 'email username');
    if (!enrollment) {
      console.error('Enrollment not found:', { userId, courseId });
      return res.status(404).json({ message: 'Enrollment not found. You must be enrolled to receive a certificate.' });
    }

    if (!enrollment.userId.email || !enrollment.userId.username) {
      console.error('User data incomplete:', enrollment.userId);
      return res.status(400).json({ message: 'User email or username missing' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: 50
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));

    doc.fontSize(36)
      .font('Helvetica-Bold')
      .text('Certificate of Achievement', 0, 50, { align: 'center' });

    doc.moveDown(2)
      .lineWidth(2)
      .moveTo(50, doc.y)
      .lineTo(790, doc.y)
      .stroke();

    doc.moveDown(2)
      .fontSize(28)
      .font('Helvetica')
      .text(`This certifies that`, 0, doc.y, { align: 'center' })
      .moveDown()
      .fontSize(32)
      .font('Helvetica-Bold')
      .text(`${enrollment.userId.username || 'Participant'}`, 0, doc.y, { align: 'center' });

    doc.moveDown()
      .fontSize(24)
      .font('Helvetica')
      .text(`has successfully achieved a perfect score in the quiz for`, 0, doc.y, { align: 'center' })
      .moveDown()
      .fontSize(28)
      .font('Helvetica-Bold')
      .text(`${course.title}`, 0, doc.y, { align: 'center' });

    doc.moveDown(2)
      .fontSize(20)
      .font('Helvetica')
      .text(`Date: ${new Date().toLocaleDateString()}`, 50, doc.y, { align: 'left' })
      .text(`Instructor: ${course.createdBy.username || 'Instructor'}`, 50, doc.y, { align: 'right' });

    doc.end();

    const pdfData = await new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => {
        console.error('PDF generation error:', err);
        reject(err);
      });
    });

    const emailList = [enrollment.userId.email, 'admin@example.com'].filter(email => email);
    console.log('Sending certificate to emails:', emailList);

    for (const email of emailList) {
      const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: email,
        subject: `Certificate of Achievement for ${course.title}`,
        text: `Dear ${enrollment.userId.username || 'Participant'},\n\nCongratulations on achieving a perfect score in the quiz for "${course.title}"! Please find your certificate attached.\n\nBest regards,\nDevMinds Team`,
        attachments: [
          {
            filename: `certificate-${course.title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
            content: pdfData,
            contentType: 'application/pdf'
          }
        ]
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`Certificate email sent to ${email}`);
      } catch (emailError) {
        console.error(`Failed to send email to ${email}:`, emailError);
      }
    }

    res.status(200).json({ message: 'Certificate generated and sent to email' });
  } catch (error) {
    console.error('Error generating quiz certificate:', error);
    res.status(500).json({ message: error.message || 'Error generating quiz certificate' });
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
    console.error('Error searching courses:', error);
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
        description: `Payment for course: ${course.title}`,
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
      existingRating.rating = rating;
    } else {
      course.ratings.push({ userId, rating });
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
    console.error('Error rating course:', error);
    res.status(500).json({ message: "Erreur serveur." });
  }
};

const getVideo = async (req, res) => {
  try {
    const { courseId, videoOrder } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const isCreator = course.createdBy.toString() === userId;
    const enrollment = await CourseEnrollment.findOne({ userId, courseId });
    if (!isCreator && !enrollment) {
      return res.status(403).json({ message: 'You must be enrolled or the creator to access this video' });
    }

    const adjustedOrder = parseInt(videoOrder) + 1;
    const video = course.videos.find(v => v.order === adjustedOrder);
    
    if (!video) return res.status(404).json({ message: 'Video not found' });

    res.setHeader('Content-Disposition', `attachment; filename="${video.filename}"`);
    res.setHeader('Content-Type', video.contentType);
    res.send(video.data);
  } catch (error) {
    console.error('Error getting video:', error);
    res.status(500).json({ message: error.message });
  }
};

const createComment = async (req, res) => {
  try {
    const { courseId, userId, content } = req.body;
    console.log('Received comment request:', { courseId, userId, content });

    if (!courseId || !userId || !content) {
      return res.status(400).json({ message: 'courseId, userId, and content are required' });
    }

    // Vérifier si l'utilisateur est inscrit au cours
    const enrollment = await CourseEnrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled in the course to comment' });
    }

    const prompt = `
      Analyze the following text for inappropriate content, including bad words, offensive language, or harmful content. 
      Return a JSON object with a boolean field "isInappropriate" and a "message" field explaining why if it is inappropriate. Do not include Markdown or code blocks in the response.
      
      Text to analyze: "${content}"
    `;

    let moderationResult = { isInappropriate: false, message: '' };
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let responseText = response.text().trim();
      responseText = responseText.replace(/```json\n|```/g, '');

      moderationResult = JSON.parse(responseText);
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      return res.status(500).json({ message: 'Failed to moderate comment due to API error' });
    }

    if (moderationResult.isInappropriate) {
      return res.status(400).json({ 
        message: 'There are a bad word, Please change your comment'
      });
    }

    const comment = new Comment({
      courseId,
      userId,
      content,
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id).populate('userId', 'username');
    res.status(201).json(populatedComment);
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ message: error.message || 'Internal server error' });
  }
};

const getComments = async (req, res) => {
  try {
    const { courseId } = req.query;
    
    if (!courseId) {
      return res.status(400).json({ message: 'courseId is required' });
    }

    const comments = await Comment.find({ courseId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 });
      
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error getting comments:', error);
    res.status(500).json({ message: error.message });
  }
};

const createDiscussionMessage = async (req, res) => {
  try {
    const { courseId, userId, content } = req.body;
    
    if (!courseId || !userId || !content) {
      return res.status(400).json({ message: 'courseId, userId, and content are required' });
    }

    const enrollment = await CourseEnrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled to post in the discussion' });
    }

    const prompt = `
      Analyze the following text for inappropriate content, including bad words, offensive language, or harmful content. 
      Return a JSON object with a boolean field "isInappropriate" and a "message" field explaining why if it is inappropriate. Do not include Markdown or code blocks in the response.
      
      Text to analyze: "${content}"
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    responseText = responseText.replace(/```json\n|```/g, '').trim();

    let moderationResult;
    try {
      moderationResult = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError, responseText);
      return res.status(500).json({ message: 'Failed to parse moderation response' });
    }

    if (moderationResult.isInappropriate) {
      return res.status(400).json({ 
        message: 'There are a bad word, Please change your message'
      });
    }

    const message = new DiscussionMessage({ 
      courseId, 
      userId, 
      content 
    });
    
    await message.save();
    
    const populatedMessage = await DiscussionMessage.findById(message._id).populate('userId', 'username');
    
    req.io.emit('newMessage', populatedMessage);
    
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error creating discussion message:', error);
    res.status(500).json({ message: error.message });
  }
};

const getDiscussionMessages = async (req, res) => {
  try {
    const { courseId, userId } = req.query;
    
    if (!courseId || !userId) {
      return res.status(400).json({ message: 'courseId and userId are required' });
    }

    const enrollment = await CourseEnrollment.findOne({ userId, courseId });
    if (!enrollment) {
      return res.status(403).json({ message: 'You must be enrolled to view the discussion' });
    }

    const messages = await DiscussionMessage.find({ courseId })
      .populate('userId', 'username')
      .sort({ createdAt: 1 });
      
    res.status(200).json(messages);
  } catch (error) {
    console.error('Error getting discussion messages:', error);
    res.status(500).json({ message: error.message });
  }
};

const generateQuiz = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const course = await Course.findById(courseId).populate('skillId', 'name');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // MODIFICATION: Vérifier si l'utilisateur est inscrit ou créateur
    const isCreator = course.createdBy.toString() === userId;
    const enrollment = await CourseEnrollment.findOne({ userId, courseId });
    if (!isCreator && !enrollment) {
      return res.status(403).json({ message: 'You must be enrolled or the creator to access the quiz' });
    }
    // FIN DE LA MODIFICATION

    // Vérifier si un quiz existe déjà
    if (course.quiz) {
      return res.status(200).json({ quiz: course.quiz });
    }

    const prompt = `
      Create a quiz with exactly 5 multiple-choice questions based on the following course information. Each question must have 4 answer options, with only one correct answer. Include an explanation for the correct answer. Return the quiz in a JSON object with the following structure:
      {
        "courseTitle": "Course Title",
        "questions": [
          {
            "text": "Question text",
            "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
            "correctAnswer": 0,
            "explanation": "Explanation for the correct answer"
          },
          ...
        ]
      }
      Do not include Markdown or code blocks in the response.

      Course Information:
      Title: ${course.title}
      Description: ${course.description || 'No description available'}
      Skill: ${course.skillId?.name || 'General'}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    responseText = responseText.replace(/```json\n|```/g, '').trim();

    let quiz;
    try {
      quiz = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing Gemini quiz response:', parseError, responseText);
      return res.status(500).json({ message: 'Failed to parse quiz response' });
    }

    if (!quiz.courseTitle || !quiz.questions || quiz.questions.length !== 5) {
      return res.status(500).json({ message: 'Invalid quiz structure' });
    }

    for (const question of quiz.questions) {
      if (
        !question.text ||
        !question.options ||
        question.options.length !== 4 ||
        question.correctAnswer == null ||
        question.correctAnswer < 0 ||
        question.correctAnswer > 3 ||
        !question.explanation
      ) {
        return res.status(500).json({ message: 'Invalid question structure' });
      }
    }

    // Enregistrer le quiz dans le document du cours
    course.quiz = quiz;
    await course.save();

    res.status(200).json({ quiz });
  } catch (error) {
    console.error('Error generating quiz:', error);
    res.status(500).json({ message: error.message });
  }
};

const generateCourseDescription = async (req, res) => {
  try {
    const { title, skillName } = req.body;

    console.log('Received request to generate description:', { title, skillName });

    if (!title || !skillName) {
      console.error('Missing title or skillName:', { title, skillName });
      return res.status(400).json({ message: 'Title and skillName are required' });
    }

    if (typeof title !== 'string' || typeof skillName !== 'string') {
      console.error('Invalid data types:', { titleType: typeof title, skillNameType: typeof skillName });
      return res.status(400).json({ message: 'Title and skillName must be strings' });
    }

    if (title.trim().length < 3 || skillName.trim().length < 3) {
      console.error('Title or skillName too short:', { titleLength: title.length, skillNameLength: skillName.length });
      return res.status(400).json({ message: 'Title and skillName must be at least 3 characters long' });
    }

    const prompt = `
      Generate a detailed course description (100-150 words) for a course titled "${title}" focused on the skill "${skillName}". 
      The description should include:
      - A clear overview of the course objectives.
      - The target audience (e.g., beginners, professionals).
      - Any prerequisites or required prior knowledge.
      - Key benefits or skills learners will gain.
      - A professional and engaging tone suitable for an educational platform.
      Ensure the description is concise, informative, and avoids overly technical jargon unless necessary.
      Return the description as plain text.
    `;

    console.log('Sending prompt to Gemini API:', prompt.substring(0, 100) + '...');

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (apiError) {
      console.error('Gemini API error:', apiError);
      return res.status(500).json({ message: 'Failed to communicate with AI service' });
    }

    const response = await result.response;
    let description = response.text().trim();

    // Ensure the description is within 1000 characters
    if (description.length > 1000) {
      description = description.substring(0, 997) + '...';
    }

    if (!description) {
      console.error('Empty description received from Gemini');
      return res.status(500).json({ message: 'No description generated by AI service' });
    }

    console.log('Generated description:', description.substring(0, 100) + '...');
    res.status(200).json({ description });
  } catch (error) {
    console.error('Error generating course description:', error);
    res.status(500).json({ message: error.message || 'Internal server error while generating description' });
  }
};

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  enrollInCourse,
  getEnrollmentStatus,
  searchCourses,
  processPayment,
  rateCourse,
  getVideo,
  createComment,
  getComments,
  createDiscussionMessage,
  getDiscussionMessages,
  generateQuizCertificate,
  generateQuiz,
  generateCourseDescription
};