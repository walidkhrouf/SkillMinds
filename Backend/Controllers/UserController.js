const bcrypt = require("bcrypt");
const User = require("../models/User"); 
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const { ObjectId } = mongoose.Types;

mongoose.connect("mongodb://127.0.0.1:27017/devminds_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch(err => {
    console.error("Error connecting to MongoDB", err);
  });

const conn = mongoose.connection;
let gfs;

conn.once("open", () => {
  gfs = new GridFSBucket(conn.db, { bucketName: "profileImages" });
});

const signup = async (req, res) => {
  const { username, email, phoneNumber, password, confirmPassword, role, bio, location } = req.body;
  const profileImage = req.file; 
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
    if (profileImage) {
      const uploadStream = gfs.openUploadStream(profileImage.originalname, {
        contentType: profileImage.mimetype,
      });

      uploadStream.end(profileImage.buffer);
      profileImageData = {
        filename: profileImage.originalname,
        contentType: profileImage.mimetype,
        length: profileImage.size,
        fileId: uploadStream.id, 
      };
    }
    const newUser = new User({
      userId: new ObjectId(),
      username,
      email,
      phoneNumber,
      password: hashedPassword,
      role,
      bio,
      location,
      profileImage: profileImageData,
    });
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { signup };
