const Activity = require('../models/Activity');
const jwt = require("jsonwebtoken");
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
    // Verify the token and get the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.userId || decoded.id;

    // Handle the event image (if provided)
    const eventImage = req.file
      ? {
          filename: req.file.filename,
          contentType: req.file.mimetype,
          length: req.file.size,
          fileId: null,
        }
      : null;

    // Create the activity data
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
      createdBy: userId, // Set the createdBy field to the user's ID
    };

    // Save the activity to the database
    const activity = new Activity(activityData);
    await activity.save();

    // Populate the createdBy field with the user's details
    const populatedActivity = await Activity.findById(activity._id).populate(
      'createdBy',
      'username' // Include only the username field
    );

    // Send the response with the populated activity
    res.status(201).json(populatedActivity);
  } catch (error) {
    console.error("Error creating activity:", error.message);
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Invalid or expired token", error: error.message });
    }
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get all activities
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ createdBy: { $exists: true } })
      .populate('createdBy', 'username')
      .populate('participants', 'username'); // Populate participants' usernames
    res.status(200).json(activities);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific activity by ID
const getActivityById = async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }
    res.status(200).json(activity);
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    // Handle the amount field correctly
    existingActivity.amount = req.body.isPaid ? Number(req.body.amount) : null;

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

// Delete an activity by ID
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

    // If the activity is paid, create a PaymentIntent
    if (activity.isPaid) {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: activity.amount * 100, // Amount in cents
        currency: 'usd',
        metadata: {
          activityId: activity._id.toString(),
          userId: userId,
        },
      });

      return res.status(200).json({
        message: 'Payment required',
        clientSecret: paymentIntent.client_secret, // Send client secret to the frontend
      });
    }

    // If the activity is free, add the user to the participants list
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

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    console.log('Payment Intent Status:', paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not succeeded' });
    }

    // Find the activity
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    // Check if the user is already participating
    if (activity.participants.includes(userId)) {
      return res.status(400).json({ message: 'You are already participating in this activity.' });
    }

    // Add the user to the participants list and decrease the number of places
    activity.participants.push(userId);
    activity.numberOfPlaces -= 1;
    await activity.save();

    console.log('Updated Activity:', activity);

    res.status(200).json({
      message: 'Payment successful and joined the activity',
      activity: activity, // Return the updated activity
    });
  } catch (error) {
    console.error('Payment Confirmation Error:', error);
    res.status(500).json({ message: error.message });
  }
};

const getActivityStatistics = async (req, res) => {
  try {
    // Get all activities
    const activities = await Activity.find({});

    // Statistics: Number of activities by category
    const activitiesByCategory = activities.reduce((acc, activity) => {
      const category = activity.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += 1;
      return acc;
    }, {});

    // Format data for the bar chart
    const categoryStats = Object.keys(activitiesByCategory).map((category) => ({
      category,
      count: activitiesByCategory[category],
    }));

    // Statistics: Number of participants per activity
    const participantsPerActivity = activities.map((activity) => ({
      title: activity.title,
      participants: activity.participants.length,
    }));

    // Statistics: Paid vs. Free activities
    const paidActivities = activities.filter((activity) => activity.isPaid).length;
    const freeActivities = activities.length - paidActivities;

    // Statistics: Activities over time (grouped by month)
    const activitiesOverTime = activities.reduce((acc, activity) => {
      const month = new Date(activity.createdAt).toLocaleString('default', { month: 'long' });
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += 1;
      return acc;
    }, {});

    const activitiesOverTimeStats = Object.keys(activitiesOverTime).map((month) => ({
      month,
      count: activitiesOverTime[month],
    }));

    // Statistics: Most popular activities (top 5 by participants)
    const mostPopularActivities = activities
      .sort((a, b) => b.participants.length - a.participants.length)
      .slice(0, 5)
      .map((activity) => ({
        title: activity.title,
        participants: activity.participants.length,
      }));

    // Return all statistics
    res.status(200).json({
      activitiesByCategory: categoryStats,
      participantsPerActivity,
      paidVsFree: {
        paid: paidActivities,
        free: freeActivities,
      },
      activitiesOverTime: activitiesOverTimeStats,
      mostPopularActivities,
    });
  } catch (error) {
    console.error('Error fetching activity statistics:', error);
    res.status(500).json({ message: 'Failed to fetch activity statistics', error: error.message });
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

    // Filter out activities the user is involved in
    const availableActivities = allActivities.filter((activity) => {
      const isCreator = activity.createdBy && activity.createdBy._id
        ? activity.createdBy._id.toString() === userId
        : false;
      return (
        !activity.participants.includes(userId) && // Exclude if user is a participant
        !isCreator && // Exclude if user is the creator
        activity.numberOfPlaces > 0 // Ensure places are available
      );
    });

    if (availableActivities.length === 0) {
      return res.status(200).json({ message: 'No available activities to recommend', recommendations: [] });
    }

    // Get user's past activities for title and location comparison
    const userActivities = allActivities.filter((activity) => {
      const isCreator = activity.createdBy && activity.createdBy._id
        ? activity.createdBy._id.toString() === userId
        : false;
      return activity.participants.includes(userId) || isCreator;
    });

    // If no user activities, return available activities with no scoring
    if (userActivities.length === 0) {
      const recommendations = availableActivities.slice(0, 5); // Limit to 5
      return res.status(200).json({
        message: 'Recommended activities (no user history)',
        recommendations: recommendations,
      });
    }

    // Extract user activity titles and locations
    const userTitles = userActivities.map((activity) => activity.title.toLowerCase());
    const userLocations = [...new Set(userActivities.map((activity) => activity.location))];

    // Calculate recommendation scores based on title similarity and location
    const recommendations = availableActivities.map((activity) => {
      let score = 0;

      // Title similarity (using Jaro-Winkler distance)
      const titleSimilarity = userTitles.reduce((maxSim, userTitle) => {
        const sim = natural.JaroWinklerDistance(userTitle, activity.title.toLowerCase());
        return Math.max(maxSim, sim);
      }, 0);
      score += titleSimilarity * 50; // Weight: 50%

      // Location proximity (simple match)
      if (userLocations.includes(activity.location)) {
        score += 30; // Weight: 30%

      }

      return { ...activity._doc, recommendationScore: score };
    });

    // Sort by score and limit to top 5
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
module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity,
  participateInActivity,
  confirmPayment,
  getActivityStatistics,
  recommendActivities,
};