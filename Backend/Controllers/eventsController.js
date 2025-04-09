const Activity = require('../models/Activity');
const jwt = require("jsonwebtoken");
const axios = require('axios');
const natural = require('natural');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const createActivity = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

  
    const eventImage = req.file
      ? {
          filename: req.file.filename,
          contentType: req.file.mimetype,
          length: req.file.size,
          fileId: null,
        }
      : null;

    
    const activityData = {
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      date: req.body.date,
      location: req.body.location,
      eventImage: eventImage,
      isPaid: req.body.isPaid,
      numberOfPlaces: req.body.numberOfPlaces,
      amount: req.body.amount,
      link: req.body.link,
      createdBy: userId, 
    };

    
    const activity = new Activity(activityData);
    await activity.save();

    
    const populatedActivity = await Activity.findById(activity._id).populate(
      'createdBy',
      'username' 
    );

    
    res.status(201).json(populatedActivity);
  } catch (error) {
    console.error("Error creating activity:", error.message);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token", error: error.message });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ createdBy: { $exists: true } })
      .populate('createdBy', 'username')
      .populate('participants', 'username'); 
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id)
      .populate('createdBy', 'username')          
      .populate('participants', 'username')       
      .populate('ratings.userId', 'username')     
      .populate('comments.userId', 'username');   

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.status(200).json(activity);
  } catch (error) {
    console.error('Error fetching activity by ID:', error); // Add logging for debugging
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const updateActivity = async (req, res) => {
  try {
    const existingActivity = await Activity.findById(req.params.id);
    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    existingActivity.title = req.body.title || existingActivity.title;
    existingActivity.description = req.body.description || existingActivity.description;
    existingActivity.category = req.body.category || existingActivity.category;
    existingActivity.date = req.body.date || existingActivity.date;
    existingActivity.location = req.body.location || existingActivity.location;
    existingActivity.isPaid = req.body.isPaid || existingActivity.isPaid;
    existingActivity.numberOfPlaces = req.body.numberOfPlaces || existingActivity.numberOfPlaces;

    
    if (req.body.isPaid) {
      const amount = parseFloat(req.body.amount);
      existingActivity.amount = isNaN(amount) ? null : amount; 
    } else {
      existingActivity.amount = null; 
    }

    existingActivity.link = req.body.link || existingActivity.link;

    if (req.file) {
      existingActivity.eventImage = {
        filename: req.file.filename,
        contentType: req.file.mimetype,
        length: req.file.size,
        fileId: null,
      };
    }

    const updatedActivity = await existingActivity.save();
    const populatedActivity = await Activity.findById(updatedActivity._id).populate('createdBy', 'username');

    res.status(200).json(populatedActivity);
  } catch (error) {
    console.error('Update Error:', error);
    res.status(400).json({ message: error.message });
  }
};

const deleteActivity = async (req, res) => {
  try {
    const activity = await Activity.findByIdAndDelete(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const participateInActivity = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    if (activity.participants.includes(userId)) {
      return res.status(400).json({ message: 'You are already participating in this activity.' });
    }

    if (activity.numberOfPlaces <= 0) {
      return res.status(400).json({ message: 'No available places for this activity.' });
    }

    
    if (activity.isPaid) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: activity.amount * 100, 
        currency: 'usd',
        metadata: {
          activityId: activity._id.toString(),
          userId: userId,
        },
      });

      return res.status(200).json({
        message: 'Payment required',
        clientSecret: paymentIntent.client_secret, 
      });
    }

    
    activity.participants.push(userId);
    activity.numberOfPlaces -= 1;
    await activity.save();

    res.status(200).json({
      message: 'Successfully joined the activity',
      activity: activity,
    });
  } catch (error) {
    console.error('Participation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const confirmPayment = async (req, res) => {
  const { paymentIntentId, activityId, userId } = req.body;

  try {
    console.log('Incoming Request:', req.body);

    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Payment Intent Status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not succeeded' });
    }

    
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    
    if (activity.participants.includes(userId)) {
      return res.status(400).json({ message: 'You are already participating in this activity.' });
    }

    
    activity.participants.push(userId);
    activity.numberOfPlaces -= 1;
    await activity.save();

    console.log('Updated Activity:', activity);

    res.status(200).json({
      message: 'Payment successful and joined the activity',
      activity: activity, 
    });
  } catch (error) {
    console.error('Payment Confirmation Error:', error);
    res.status(500).json({ message: error.message });
  }
};




const recommendActivities = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authentication token required' });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Token not provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const allActivities = await Activity.find({})
      .populate('createdBy', 'username')
      .populate('participants', 'username');

    
    const availableActivities = allActivities.filter((activity) => {
      const isCreator = activity.createdBy && activity.createdBy._id
        ? activity.createdBy._id.toString() === userId
        : false;
      return (
        !activity.participants.includes(userId) && 
        !isCreator && 
        activity.numberOfPlaces > 0 
      );
    });

    if (availableActivities.length === 0) {
      return res.status(200).json({ message: 'No available activities to recommend', recommendations: [] });
    }

    
    const userActivities = allActivities.filter((activity) => {
      const isCreator = activity.createdBy && activity.createdBy._id
        ? activity.createdBy._id.toString() === userId
        : false;
      return activity.participants.includes(userId) || isCreator;
    });

    
    if (userActivities.length === 0) {
      const recommendations = availableActivities.slice(0, 5); 
      return res.status(200).json({
        message: 'Recommended activities (no user history)',
        recommendations: recommendations,
      });
    }

    
    const userTitles = userActivities.map((activity) => activity.title.toLowerCase());
    const userLocations = [...new Set(userActivities.map((activity) => activity.location))];

    
    const recommendations = availableActivities.map((activity) => {
      let score = 0;

      
      const titleSimilarity = userTitles.reduce((maxSim, userTitle) => {
        const sim = natural.JaroWinklerDistance(userTitle, activity.title.toLowerCase());
        return Math.max(maxSim, sim);
      }, 0);
      score += titleSimilarity * 50; 

    
      if (userLocations.includes(activity.location)) {
        score += 30; // Weight: 30%

      }

      return { ...activity._doc, recommendationScore: score };
    });

    
    const sortedRecommendations = recommendations
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, 5);

    res.status(200).json({
      message: 'Recommended activities',
      recommendations: sortedRecommendations,
    });
  } catch (error) {
    console.error('Error recommending activities:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token. Please log in again.' });
    }
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const generateAIImage = async (req, res) => {
  const { title } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    
    const response = await axios.post(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image',
      {
        text_prompts: [
          {
            text: `logo of: ${title}, high quality`,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 1024,
        width: 1024,
        steps: 30,
        samples: 1,
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        responseType: 'json'
      }
    );

    
    const imageData = response.data.artifacts[0].base64;
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.png`;

    res.json({
      filename,
      contentType: 'image/png',
      data: imageData 
    });

  } catch (error) {
    console.error('Stability AI error:', error.response?.data || error.message);
    
    
    const errorMessage = error.response?.data?.message || 
                        error.response?.data?.errors?.join(', ') || 
                        error.message;
    
    res.status(500).json({
      message: 'Failed to generate image',
      error: errorMessage,
      details: error.response?.data || null
    });
  }
};


const submitRating = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const { rating } = req.body;
    const { id: activityId } = req.params;

    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Please provide a valid rating between 1 and 5' });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    
    const existingRatingIndex = activity.ratings.findIndex(
      r => r.userId.toString() === userId.toString()
    );

    if (existingRatingIndex >= 0) {
      
      activity.ratings[existingRatingIndex].rating = rating;
    } else {
      
      activity.ratings.push({ userId, rating });
    }

    
    activity.updateAverageRating();
    await activity.save();

    
    const updatedActivity = await Activity.findById(activityId)
      .populate('ratings.userId', 'username');

    res.status(200).json({
      message: 'Rating submitted successfully',
      activity: updatedActivity,
      averageRating: updatedActivity.averageRating,
      userRating: rating
    });
  } catch (error) {
    console.error("Error submitting rating:", error.message);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token", error: error.message });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getUserRating = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    const { id: activityId } = req.params;

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const userRating = activity.ratings.find(
      r => r.userId.toString() === userId.toString()
    );

    res.status(200).json({
      userRating: userRating ? userRating.rating : null,
      averageRating: activity.averageRating,
      totalRatings: activity.ratings.length
    });
  } catch (error) {
    console.error("Error getting user rating:", error.message);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token", error: error.message });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


const getActivityRatings = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;
    
    // Check if user is admin (you might need to adjust this based on your user model)
    if (!decoded.isAdmin && decoded.role !== 'admin') {
      return res.status(403).json({ message: "Admin privileges required" });
    }

    const { id: activityId } = req.params;

    const activity = await Activity.findById(activityId)
      .populate('ratings.userId', 'username email')
      .select('ratings averageRating');

    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    res.status(200).json({
      averageRating: activity.averageRating,
      totalRatings: activity.ratings.length,
      ratings: activity.ratings
    });
  } catch (error) {
    console.error("Error getting activity ratings:", error.message);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token", error: error.message });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const submitComment = async (req, res) => {
  try {
    const { text } = req.body;
    const activityId = req.params.id;
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const newComment = {
      userId,
      text,
    };

    activity.comments.push(newComment);
    await activity.save();

    const updatedActivity = await Activity.findById(activityId)
      .populate('createdBy', 'username')
      .populate('participants', 'username')
      .populate({
        path: 'comments.userId',
        select: 'username profileImage',
        populate: {
          path: 'profileImage',
          model: 'File'
        }
      });

    res.status(201).json({
      message: "Comment added successfully",
      activity: updatedActivity
    });
  } catch (error) {
    console.error("Error submitting comment:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getActivityComments = async (req, res) => {
  try {
    const activityId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const activity = await Activity.findById(activityId)
      .populate({
        path: 'comments.userId',
        select: 'username profileImage',
        populate: {
          path: 'profileImage',
          model: 'File'
        }
      });

    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const totalComments = activity.comments.length;
    const paginatedComments = activity.comments.slice(skip, skip + limit);

    res.status(200).json({
      comments: paginatedComments,
      totalComments,
      currentPage: page,
      totalPages: Math.ceil(totalComments / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const { text } = req.body;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const comment = activity.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only edit your own comments" });
    }

    comment.text = text;
    comment.updatedAt = Date.now();
    await activity.save();

    const updatedActivity = await Activity.findById(id)
      .populate('createdBy', 'username')
      .populate('participants', 'username')
      .populate({
        path: 'comments.userId',
        select: 'username profileImage',
        populate: { path: 'profileImage', model: 'File' }
      });

    res.status(200).json({
      message: "Comment updated successfully",
      activity: updatedActivity
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Authentication token required" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    const activity = await Activity.findById(id);
    if (!activity) {
      return res.status(404).json({ message: "Activity not found" });
    }

    const comment = activity.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own comments" });
    }

    activity.comments.id(commentId).deleteOne();
    await activity.save();

    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getActivityCategoryStats = async (req, res) => {
  try {
    const categoryStats = await Activity.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          value: '$count',
          _id: 0
        }
      }
    ]);

    const totalActivities = await Activity.countDocuments();

    res.status(200).json({
      categories: categoryStats,
      total: totalActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching activity category statistics', error: error.message });
  }
};

const getTrendingActivities = async (req, res) => {
  try {
    const trendingActivities = await Activity.find()
      .sort({ averageRating: -1 }) 
      .limit(5) 
      .select('title averageRating'); 

    res.status(200).json(trendingActivities);
  } catch (error) {
    console.error('Error fetching trending activities:', error);
    res.status(500).json({
      message: 'Error fetching trending activities',
      error: error.message,
    });
  }
};
module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  participateInActivity,
  confirmPayment,
  getActivityCategoryStats,
  getTrendingActivities,
  recommendActivities,
  generateAIImage,
  getActivityRatings,
  submitRating,
  getUserRating,
  submitComment,
  getActivityComments,
  updateComment,
  deleteComment
};