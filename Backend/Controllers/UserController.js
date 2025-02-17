const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const { ObjectId } = mongoose.Types;

mongoose.connect("mongodb://127.0.0.1:27017/devminds_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch(err => console.error("Error connecting to MongoDB", err));

const conn = mongoose.connection;
let gfs;
conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, { bucketName: "profileImages" });
});

const uploadFileToGridFS = (file) => {
  return new Promise((resolve, reject) => {
    const uploadStream = gfs.openUploadStream(file.originalname, {
      contentType: file.mimetype,
    });
    uploadStream.end(file.buffer, (error) => {
      if (error) return reject(error);
      resolve(uploadStream.id);
    });
  });
};

const signup = async (req, res) => {
  const { username, email, phoneNumber, password, confirmPassword, role, bio, location } = req.body;
  const profileImage = req.files && req.files.profileImage ? req.files.profileImage[0] : null;
  const certificateImage = req.files && req.files.certificateImage ? req.files.certificateImage[0] : null;

  if (!username || !email || !password || !confirmPassword || !role) {
    return res.status(400).json({ message: "All fields are required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let profileImageData = null;
    let certificateImageData = null;

    if (profileImage) {
      const fileId = await uploadFileToGridFS(profileImage);
      profileImageData = {
        filename: profileImage.originalname,
        contentType: profileImage.mimetype,
        length: profileImage.size,
        fileId: fileId,
      };
    }

    if (role === "mentor" && certificateImage) {
      const certFileId = await uploadFileToGridFS(certificateImage);
      certificateImageData = {
        filename: certificateImage.originalname,
        contentType: certificateImage.mimetype,
        length: certificateImage.size,
        fileId: certFileId,
      };
    }

    // For mentor signups, assign role "learner" until admin approval.
    const finalRole = role === "mentor" ? "learner" : role;

    const newUser = new User({
      userId: new ObjectId(),
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      role: finalRole,
      bio,
      location,
      profileImage: profileImageData,
      certificateImage: certificateImageData,
    });

    await newUser.save();

    // Create a welcome notification
    const newNotification = new Notification({
      userId: newUser._id,
      type: "ACCOUNT_UPDATE",
      message: "Welcome to SkillMind! Your account has been created successfully.",
    });
    await newNotification.save();

    return res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, { username: 1, email: 1, role: 1 });
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user)
      return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const updateFields = {
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
      phoneNumber: req.body.phoneNumber,
      bio: req.body.bio,
      location: req.body.location,
    };
    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });
    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser)
      return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("Error deleting user:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

module.exports = { signup, getAllUsers, getUserById, updateUser, deleteUser };
