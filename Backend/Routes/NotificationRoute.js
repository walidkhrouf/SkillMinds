// Routes/notificationRoute.js
const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");

router.get("/", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ message: "userId parameter is required." });
  }
  try {
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});

router.post("/", async (req, res) => {
  const { userId, type, message } = req.body;
  if (!userId || !type || !message) {
    return res.status(400).json({ message: "Missing required fields." });
  }
  try {
    const notification = new Notification({ userId, type, message });
    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error("Error creating notification:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
});


router.put("/:notificationId/markRead", async (req, res) => {
    try {
      const notification = await Notification.findByIdAndUpdate(
        req.params.notificationId,
        { isRead: true },
        { new: true }
      );
      if (!notification) {
        return res.status(404).json({ message: "Notification not found." });
      }
      res.json(notification);
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  });
module.exports = router;
