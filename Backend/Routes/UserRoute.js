const express = require("express");
const { signup } = require("../Controllers/UserController");
const User = require("../models/User");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const router = express.Router();

router.post("/signup", upload.single("profileImage"), signup);
router.get("/all", async (req, res) => {
    try {
      const users = await User.find(); 
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

module.exports = router;
