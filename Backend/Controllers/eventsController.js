const Activity = require('../models/Activity');

// Create a new activity
const createActivity = async (req, res) => {
  try {
    const eventImage = req.file
      ? {
          filename: req.file.filename,
          contentType: req.file.mimetype, 
          length: req.file.size,  
          fileId: null  
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
      amount: req.body.amount,
      link: req.body.link,
    };

    const activity = new Activity(activityData);
    await activity.save();
    res.status(201).json(activity);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all activities
const getActivities = async (req, res) => {
  try {
    const activities = await Activity.find();
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
    console.log('Request Body:', req.body); // Log the incoming request body
    console.log('Request Params:', req.params); // Log the activity ID

    const existingActivity = await Activity.findById(req.params.id);
    if (!existingActivity) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    console.log('Existing Activity Before Update:', existingActivity); // Log the existing activity

    // Update the fields based on the request body
    existingActivity.title = req.body.title || existingActivity.title;
    existingActivity.description = req.body.description || existingActivity.description;
    existingActivity.category = req.body.category || existingActivity.category;
    existingActivity.date = req.body.date || existingActivity.date;
    existingActivity.location = req.body.location || existingActivity.location;
    existingActivity.isPaid = req.body.isPaid || existingActivity.isPaid;
    existingActivity.amount = req.body.amount || existingActivity.amount;
    existingActivity.link = req.body.link || existingActivity.link;

    // Handle file upload if a new image is provided
    if (req.file) {
      existingActivity.eventImage = {
        filename: req.file.filename,
        contentType: req.file.mimetype,
        length: req.file.size,
        fileId: null, // Update this if you're using GridFS or another file storage system
      };
    }

    console.log('Existing Activity After Update:', existingActivity); // Log the activity after assignment

    // Validate amount if isPaid is true
    if (existingActivity.isPaid && (existingActivity.amount === undefined || existingActivity.amount === null)) {
      return res.status(400).json({ message: 'Amount is required when the activity is paid.' });
    }

    // Validate link if category is Webinar
    if (existingActivity.category === 'Webinar' && (!existingActivity.link || existingActivity.link.trim() === '')) {
      return res.status(400).json({ message: 'Link is required for webinars.' });
    }

    // Save the updated activity
    const updatedActivity = await existingActivity.save();
    console.log('Updated Activity:', updatedActivity); // Log the updated activity

    res.status(200).json(updatedActivity);
  } catch (error) {
    console.error('Update Error:', error); // Log any errors
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

module.exports = {
  createActivity,
  getActivities,
  getActivityById,
  updateActivity,
  deleteActivity
};