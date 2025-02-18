// UserController.js
const otpStore = {};
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");
const UserSkill = require("../models/UserSkill");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const { GridFSBucket } = require("mongodb");
const { ObjectId } = mongoose.Types;

mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/devminds_db", {
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
        fileId,
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

    // Create a welcome (or account update) notification for the new user
    const accountUpdateNotification = new Notification({
      userId: newUser._id,
      type: "ACCOUNT_UPDATE",
      message: "Your account has been created successfully.",
    });
    await accountUpdateNotification.save();

    // Do not return the hashed password to the client
    newUser.password = undefined;

    return res.status(201).json({ message: "User registered successfully!", user: newUser });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });
    
    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store the OTP along with a timestamp (valid for 10 minutes)
    otpStore[email] = { otp, createdAt: Date.now() };

    // Configure nodemailer with your EMAIL_USER and EMAIL_PASS
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER, // using your friend's email as set in your .env file
        pass: process.env.EMAIL_PASS, // the app password for that email
      },
      // (Optional) If you run into certificate errors, you can add:
      // tls: { rejectUnauthorized: false }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your OTP Code",
      text: `Your OTP code is: ${otp}. It is valid for 10 minutes.`,
    };

    await transporter.sendMail(mailOptions);

    // Instead of signing in immediately, respond that OTP has been sent.
    return res.json({ 
      message: "OTP sent to your email. Please verify to complete sign in.", 
      userId: user._id 
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required." });
  }

  const record = otpStore[email];
  if (!record) {
    return res.status(400).json({ message: "No OTP request found for this email." });
  }

  // Check if the OTP has expired (10 minutes expiry)
  const now = Date.now();
  if (now - record.createdAt > 10 * 60 * 1000) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP has expired. Please try again." });
  }

  if (record.otp !== otp) {
    return res.status(401).json({ message: "Invalid OTP." });
  }

  // OTP is correct; clear it from the store
  delete otpStore[email];

  // Generate JWT token now since OTP is verified
  const user = await User.findOne({ email });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
  user.password = undefined;
  return res.json({ message: "Signin successful", user, token });
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
    let updateFields = {
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
      phoneNumber: req.body.phoneNumber,
      bio: req.body.bio,
      location: req.body.location,
    };

    // Handle new profile image (if provided)
    if (req.file) {
      const profileImage = req.file;
      const fileId = await uploadFileToGridFS(profileImage);
      updateFields.profileImage = {
        filename: profileImage.originalname,
        contentType: profileImage.mimetype,
        length: profileImage.size,
        fileId,
      };
    } else if (req.files && req.files.profileImage) {
      const profileImage = req.files.profileImage[0];
      const fileId = await uploadFileToGridFS(profileImage);
      updateFields.profileImage = {
        filename: profileImage.originalname,
        contentType: profileImage.mimetype,
        length: profileImage.size,
        fileId,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!updatedUser)
      return res.status(404).json({ message: "User not found" });

    // Create a notification for the account update
    const updateNotification = new Notification({
      userId: updatedUser._id,
      type: "ACCOUNT_UPDATE",
      message: "Your account has been updated successfully.",
    });
    await updateNotification.save();

    res.json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const deleteUserSkill = async (req, res) => {
  try {
    const { skillId } = req.params;
    const deletedSkill = await UserSkill.findByIdAndDelete(skillId);
    if (!deletedSkill) {
      return res.status(404).json({ message: "Skill not found." });
    }
    res.json({ message: "Skill deleted successfully." });
  } catch (err) {
    console.error("Error deleting skill:", err);
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

const createUserSkills = async (req, res) => {
  try {
    const { userId, skills } = req.body;
    if (!userId || !Array.isArray(skills)) {
      return res.status(400).json({ message: "Invalid input" });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userSkills = skills.map(skill => ({
      userId: new ObjectId(userId),
      skillId: new ObjectId(skill.skillId),
      skillType: skill.skillType,
      verificationStatus: skill.skillType === "has" ? "unverified" : "pending"
    }));

    const createdSkills = await UserSkill.insertMany(userSkills);
    
    await User.findByIdAndUpdate(userId, { firstTimeLogin: false });

    res.status(201).json({ message: "Skills saved successfully", userSkills: createdSkills });
  } catch (err) {
    console.error("Error creating user skills:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const updateUserSkills = async (req, res) => {
  try {
    const { userId, skills } = req.body;
    if (!userId || !Array.isArray(skills)) {
      return res.status(400).json({ message: "Invalid input. Please provide userId and an array of skills." });
    }
    
    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    
    // Remove existing skills for this user
    await UserSkill.deleteMany({ userId: userId });
    
    // Prepare new skills to insert.
    // Each element should have: { skillId, skillType }
    const userSkills = skills.map(skill => ({
      userId: new ObjectId(userId),
      skillId: new ObjectId(skill.skillId),
      skillType: skill.skillType,
      // Set verificationStatus based on skillType:
      verificationStatus: skill.skillType === "has" ? "unverified" : "pending",
    }));
    
    const createdSkills = await UserSkill.insertMany(userSkills);
    
    res.status(200).json({
      message: "User skills updated successfully",
      userSkills: createdSkills
    });
  } catch (err) {
    console.error("Error updating user skills:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};



const getUserSkills = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ message: "Missing userId parameter" });
    }
    const userSkills = await UserSkill.find({ userId: userId }).populate("skillId");
    res.json(userSkills);
  } catch (err) {
    console.error("Error fetching user skills:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with that email address." });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      subject: "Password Reset Request",
      text: `
        You requested a password reset. Please click the link below to reset your password:
        http://localhost:5173/reset-password/${user._id}/${token}
        
        If you did not request this, please ignore this email.
      `,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link has been sent to your email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "An error occurred while processing your request.", error: err.message });
  }
};

const resetPassword = async (req, res) => {
  const { id, token } = req.params;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.id !== id) {
      return res.status(401).json({ message: "Unauthorized access." });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({ message: "Token has expired." });
    }
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

module.exports = {
  signup,
  signin,
  verifyOTP,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createUserSkills,
  getUserSkills,
  forgotPassword,
  resetPassword,
  deleteUserSkill,
  updateUserSkills,
};
