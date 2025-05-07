const Tutorial = require("../models/Tutorial");
const TutorialComment = require("../models/TutorialComment");
const TutorialLike = require("../models/TutorialLike");
const mongoose = require("mongoose");
const twilio = require("twilio");

// Twilio credentials (use environment variables for production)
const client = twilio('AC27d7e1709a833aa34c8ec14f6950e7bc', '500fdc24680bc05801b8c551b17a6fff');

exports.createTutorial = async (req, res) => {
  const { title, content, category, userId, media } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const tutorial = new Tutorial({
      title,
      content,
      category,
      authorId: userId,
      media: media ? JSON.parse(media) : [],
    });

    await tutorial.save();

    const populatedTutorial = await Tutorial.findById(tutorial._id).populate("authorId", "username email");

    const message = "A User created a new tutorial Successfully!";
    const toPhoneNumber = "+21694440966";
    const fromPhoneNumber = "+19413901769";

    client.messages
        .create({ body: message, from: fromPhoneNumber, to: toPhoneNumber })
        .then((message) => console.log(`SMS sent: ${message.sid}`))
        .catch((error) => console.error("Error sending SMS:", error));

    res.status(201).json({
      message: "Tutorial created successfully",
      tutorial: populatedTutorial,
    });
  } catch (error) {
    console.error("Error creating tutorial:", error);
    res.status(500).json({ message: "Failed to create tutorial", error: error.message });
  }
};

exports.getAllTutorials = async (req, res) => {
  try {
    const tutorials = await Tutorial.find()
        .populate("authorId", "username email")
        .sort({ createdAt: -1 });
    res.status(200).json(tutorials);
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    res.status(500).json({ message: "Failed to fetch tutorials", error: error.message });
  }
};

exports.getTutorialById = async (req, res) => {
  const { tutorialId } = req.params;

  try {
    const tutorial = await Tutorial.findById(tutorialId).populate("authorId", "username email");
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });

    const comments = await TutorialComment.find({ tutorialId: tutorial._id })
        .populate("userId", "username");
    const likes = await TutorialLike.find({ tutorialId: tutorial._id }).countDocuments();

    res.status(200).json({ tutorial, comments, likes });
  } catch (error) {
    console.error("Error fetching tutorial:", error);
    res.status(500).json({ message: "Failed to fetch tutorial", error: error.message });
  }
};

exports.updateTutorial = async (req, res) => {
  const { tutorialId } = req.params;
  const { title, content, category, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });
    if (tutorial.authorId.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to edit this tutorial" });
    }

    tutorial.title = title || tutorial.title;
    tutorial.content = content || tutorial.content;
    tutorial.category = category || tutorial.category;
    await tutorial.save();

    const updatedTutorial = await Tutorial.findById(tutorial._id).populate("authorId", "username email");
    res.status(200).json({ message: "Tutorial updated successfully", tutorial: updatedTutorial });
  } catch (error) {
    console.error("Error updating tutorial:", error);
    res.status(500).json({ message: "Failed to update tutorial", error: error.message });
  }
};

exports.deleteTutorial = async (req, res) => {
  const { tutorialId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });
    if (tutorial.authorId.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this tutorial" });
    }

    await Tutorial.deleteOne({ _id: tutorialId });
    await TutorialComment.deleteMany({ tutorialId: tutorial._id });
    await TutorialLike.deleteMany({ tutorialId: tutorial._id });

    res.status(200).json({ message: "Tutorial deleted successfully" });
  } catch (error) {
    console.error("Error deleting tutorial:", error);
    res.status(500).json({ message: "Failed to delete tutorial", error: error.message });
  }
};

exports.likeTutorial = async (req, res) => {
  const { tutorialId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });

    const existingLike = await TutorialLike.findOne({ tutorialId: tutorial._id, userId });
    let likesCount = await TutorialLike.find({ tutorialId: tutorial._id }).countDocuments();

    if (existingLike) {
      await TutorialLike.deleteOne({ _id: existingLike._id });
      likesCount -= 1;
      return res.status(200).json({ message: "Like removed", likes: likesCount });
    }

    const like = new TutorialLike({ tutorialId: tutorial._id, userId });
    await like.save();
    likesCount += 1;

    res.status(200).json({ message: "Tutorial liked", likes: likesCount });
  } catch (error) {
    console.error("Error liking tutorial:", error);
    res.status(500).json({ message: "Failed to like tutorial", error: error.message });
  }
};

exports.addComment = async (req, res) => {
  const { tutorialId } = req.params;
  const { content, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content is required" });
  }

  try {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });

    const comment = new TutorialComment({ tutorialId: tutorial._id, userId, content });
    await comment.save();

    const populatedComment = await TutorialComment.findById(comment._id).populate("userId", "username");
    res.status(201).json({ message: "Comment added", comment: populatedComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};

module.exports = exports;