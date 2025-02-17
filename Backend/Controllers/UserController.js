const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");
const UserSkill = require("../models/UserSkill");
const mongoose = require("mongoose");

const nodemailer = require("nodemailer");
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

const signin = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "User not found" });
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    return res.json({ message: "Signin successful", user });
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
    let updateFields = {
      username: req.body.username,
      email: req.body.email,
      role: req.body.role,
      phoneNumber: req.body.phoneNumber,
      bio: req.body.bio,
      location: req.body.location,
    };

    if (req.file) {
      const profileImage = req.file;
      const fileId = await uploadFileToGridFS(profileImage);
      updateFields.profileImage = {
        filename: profileImage.originalname,
        contentType: profileImage.mimetype,
        length: profileImage.size,
        fileId: fileId,
      };
    } else if (req.files && req.files.profileImage) {
      const profileImage = req.files.profileImage[0];
      const fileId = await uploadFileToGridFS(profileImage);
      updateFields.profileImage = {
        filename: profileImage.originalname,
        contentType: profileImage.mimetype,
        length: profileImage.size,
        fileId: fileId,
      };
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
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

    const token = jwt.sign({ id: user.id , email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      to: user.email,
      subject: 'Password Reset Request',
      text: `
        You requested a password reset. Please click the link below to reset your password:
        http://localhost:5173/reset-password/${user.id}/${token}
        
        If you did not request this, please ignore this email.
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    // Respond to the user
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
    // Verify the token
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
module.exports = { signup, signin, getAllUsers, getUserById, updateUser, deleteUser, createUserSkills,getUserSkills, forgotPassword , resetPassword};
