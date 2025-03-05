const otpStore = {};
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Notification = require("../models/Notification");
const UserSkill = require("../models/UserSkill");
const { mongoose } = require("../config/databaseConnection");
const nodemailer = require("nodemailer");
const { GridFSBucket } = require("mongodb");
const { ObjectId } = mongoose.Types;
const axios = require('axios');
const stateStore = {};
let gfs;

mongoose.connection.once("open", () => {
  gfs = new GridFSBucket(mongoose.connection.db, { bucketName: "profileImages" });
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
  const { username, email, phoneNumber, password, confirmPassword, role, bio, location, mentorSkills } = req.body;

  console.log("Signup Request Body:", req.body);
  console.log("Signup Request Files:", req.files);

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
    let certificateImageData = [];
    let mentorSkillEntries = [];

    const profileImageFile = req.files.find(file => file.fieldname === "profileImage");
    if (profileImageFile) {
      console.log("Uploading Profile Image:", profileImageFile);
      const fileId = await uploadFileToGridFS(profileImageFile);
      profileImageData = {
        filename: profileImageFile.originalname,
        contentType: profileImageFile.mimetype,
        length: profileImageFile.size,
        fileId,
      };
    } else {
      console.log("No Profile Image Found");
    }

    const parsedMentorSkills = mentorSkills ? JSON.parse(mentorSkills) : [];
    if (role === "mentor" && parsedMentorSkills.length > 0) {
      certificateImageData = await Promise.all(
        parsedMentorSkills.map(async (skillId) => {
          const fieldName = `mentorCertificate_${skillId}`;
          const certFile = req.files.find(file => file.fieldname === fieldName);
          if (certFile) {
            console.log(`Uploading Certificate for Skill ${skillId}:`, certFile);
            const certFileId = await uploadFileToGridFS(certFile);
            return {
              filename: certFile.originalname,
              contentType: certFile.mimetype,
              length: certFile.size,
              fileId: certFileId,
            };
          } else {
            console.log(`No Certificate Found for Skill ${skillId}`);
            return null;
          }
        })
      ).then(results => results.filter(Boolean));

      mentorSkillEntries = parsedMentorSkills.map(skillId => ({
        userSkillId: Date.now().toString() + Math.random().toString(36).substring(2, 15),
        userId: null,
        skillId: new ObjectId(skillId),
        skillType: "has",
        verificationStatus: "unverified"
      }));
    }

    const finalRole = role === "mentor" ? "unverified mentor" : role;

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

    if (mentorSkillEntries.length > 0) {
      mentorSkillEntries = mentorSkillEntries.map(entry => ({
        ...entry,
        userId: newUser._id
      }));
      await UserSkill.insertMany(mentorSkillEntries);
    }

    const accountUpdateNotification = new Notification({
      userId: newUser._id,
      type: "ACCOUNT_UPDATE",
      message: "Your account has been created successfully.",
    });
    await accountUpdateNotification.save();

    newUser.password = undefined;

    console.log("New User Saved:", newUser);
    return res.status(201).json({ message: "User registered successfully!", user: newUser });
  } catch (err) {
    console.error("Signup Error:", err);
    return res.status(500).json({ message: "Internal server error", error: err.message });
  }
};

const updateUserSkillById = async (req, res) => {
  try {
    const { id } = req.params;
    const update = req.body;
    const updatedSkill = await UserSkill.findByIdAndUpdate(id, update, { new: true });
    if (!updatedSkill) {
      return res.status(404).json({ message: "Skill not found." });
    }
    res.status(200).json(updatedSkill);
  } catch (err) {
    console.error("Error updating user skill:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore[email] = { otp, createdAt: Date.now() };

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Your OTP Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px; background-color: #ffffff;">
          <div style="text-align: center; padding: 20px; background-color: #007bff; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">SkillMinds</h1>
          </div>
          <div style="padding: 20px;">
            <h2 style="color: #333; font-size: 20px; margin-bottom: 15px;">Your OTP Code</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.5;">Your One-Time Password (OTP) code is:</p>
            <div style="text-align: center; margin: 20px 0;">
              <p style="font-size: 24px; font-weight: bold; color: #007bff; background-color: #f8f9fa; padding: 10px; border-radius: 5px; display: inline-block;">
                ${otp}
              </p>
            </div>
            <p style="color: #555; font-size: 14px; text-align: center;">This code is valid for <strong>10 minutes</strong>.</p>
            <p style="color: #777; font-size: 12px; text-align: center;">If you did not request this OTP, please ignore this email.</p>
          </div>
          <div style="text-align: center; padding: 20px; background-color: #f8f9fa; border-radius: 0 0 10px 10px;">
            <p style="color: #777; margin: 5px 0 0; font-size: 12px;">Contact us: <a href="mailto:skillminds.team@gmail.com" style="color: #007bff; text-decoration: none;">skillminds.team@gmail.com</a></p>
          </div>
        </div>
      `,
      text: `
        ================================
                Your OTP Code
        ================================
        Your One-Time Password (OTP) code is:
        **${otp}**
        This code is valid for 10 minutes.
        If you did not request this OTP, please ignore this email.
        ================================
        DevMinds - Your Development Partner
        Contact us: skillminds.team@gmail.com
        ================================
      `,
    };

    await transporter.sendMail(mailOptions);

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

  const now = Date.now();
  if (now - record.createdAt > 10 * 60 * 1000) {
    delete otpStore[email];
    return res.status(400).json({ message: "OTP has expired. Please try again." });
  }

  if (record.otp !== otp) {
    return res.status(401).json({ message: "Invalid OTP." });
  }

  delete otpStore[email];

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

const getUserSkillsBySkillId = async (req, res) => {
  const { skillId } = req.params;
  try {
    const userSkills = await UserSkill.find({ skillId: skillId });
    if (!userSkills || userSkills.length === 0) {
      return res.status(404).json({ message: "No user skills found for this skill" });
    }
    res.status(200).json(userSkills);
  } catch (error) {
    console.error("Error retrieving user skills by skillId:", error);
    res.status(500).json({ message: "Error retrieving user skills", error: error.message });
  }
};

const removeUserSkillsBySkillId = async (req, res) => {
  try {
    const { skillId } = req.params;
    const result = await UserSkill.deleteMany({ skillId });
    if (result.deletedCount === 0) {
      return res.status(200).json({ message: "Aucune référence trouvée pour cette compétence" });
    }
    res.status(200).json({ message: `${result.deletedCount} références supprimées pour la compétence` });
  } catch (error) {
    console.error("Erreur lors de la suppression des références UserSkill:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user)
      return res.status(404).json({ message: "User not found" });

    if (!Array.isArray(user.certificateImage)) {
      user.certificateImage = user.certificateImage ? [user.certificateImage] : [];
    }

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

    const extraPayload = req.body.extraPayload || {};

    if (!userId || !Array.isArray(skills)) {
      return res.status(400).json({ message: "Invalid input. Please provide userId and an array of skills." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await UserSkill.deleteMany({ userId: userId });

    const userSkills = skills.map(skill => ({
      userId: new ObjectId(userId),
      skillId: new ObjectId(skill.skillId),
      skillType: skill.skillType,
      verificationStatus: extraPayload.verificationStatus
        ? extraPayload.verificationStatus
        : (skill.verificationStatus
            ? skill.verificationStatus
            : (skill.skillType === "has" ? "unverified" : "pending"))
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

    const resetLink = `http://localhost:5173/reset-password/${user._id}/${token}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: { rejectUnauthorized: false }
    });

    const mailOptions = {
      to: user.email,
      subject: "Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 10px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; padding: 10px; background-color: #007bff; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">SkillMinds</h1>
          </div>
          <div style="padding: 15px;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 10px;">Password Reset Request</h2>
            <p style="color: #555; font-size: 14px; line-height: 1.5;">You requested a password reset. Please click the button below to reset your password:</p>
            <div style="text-align: center; margin: 15px 0;">
              <a href="${resetLink}" style="display: inline-block; padding: 8px 16px; font-size: 14px; color: white; background-color: #007bff; text-decoration: none; border-radius: 4px;">
                Reset Password
              </a>
            </div>
            <p style="color: #555; font-size: 12px; text-align: center;">If you did not request this, please ignore this email.</p>
          </div>
          <div style="text-align: center; padding: 10px; background-color: #f8f9fa; border-radius: 0 0 8px 8px;">
            <p style="color: #777; margin: 0; font-size: 12px;">Contact us: <a href="mailto:skillminds.team@gmail.com" style="color: #007bff; text-decoration: none;">skillminds.team@gmail.com</a></p>
          </div>
        </div>
      `,
      text: `You requested a password reset. Please click the link below to reset your password:\n\n${resetLink}\n\nIf you did not request this, please ignore this email.`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link has been sent to your email." });
  } catch (err) {
    console.error("Error sending email:", err);
    res.status(500).json({ message: "An error occurred while processing your request.", error: err.message });
  }
};

const finishSkillSelection = async (req, res) => {
  try {
    const { userId, selectedSkills } = req.body;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const userSkills = selectedSkills.map(skill => ({
      userId: new ObjectId(userId),
      skillId: new ObjectId(skill.skillId),
      skillType: skill.skillType,
      verificationStatus: user.role === "mentor" ? "pending" : "unverified"
    }));
    await UserSkill.insertMany(userSkills);

    await User.findByIdAndUpdate(userId, { hasChosenSkills: true });

    res.status(200).json({ message: "Skill selection complete." });
  } catch (err) {
    console.error("Error finishing skill selection:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
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
      return res.status(401).json({ message: "Invalid token. Please request a new password reset link." });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        message: "Token has expired. Please request a new password reset link.",
        expired: true,
      });
    }

    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};


const handleGoogleUser = async (googleId, email, name) => {
  try {
    let user = await User.findOne({ 'linkedAccounts.google': googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
   
        user.linkedAccounts.google = googleId;
        await user.save();
      } else {
      
        user = new User({
          userId: new ObjectId(), 
          username: name,
          email: email || `google_${googleId}@example.com`,
          phoneNumber: "", 
          password: bcrypt.hashSync(googleId, 10), 
          role: "learner", 
          bio: "",
          location: "",
          linkedAccounts: { google: googleId }, 
          hasChosenSkills: false,
        });
        await user.save();
      }
    }
    return user; 
  } catch (err) {
    throw new Error(`Error handling Google user: ${err.message}`);
  }
};


const googleCallback = async (req, res) => {
  const { googleId, email, name } = req.body;

  console.log("Google Callback Data:", req.body); 

  if (!googleId) {
    return res.status(400).json({ message: "Google ID is required" });
  }

  try {
    const user = await handleGoogleUser(googleId, email, name);

  
    const userId = user._id; 

    
    const token = jwt.sign({ id: userId, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user.password = undefined;

    
    res.json({ token, user });
  } catch (err) {
    console.error("Google Callback Error:", err);
    res.status(500).json({ message: "Error with Google authentication", error: err.message });
  }
};


const linkedinLogin = (req, res) => {
  const state = require('crypto').randomBytes(16).toString('hex');
  const stateKey = Date.now().toString();
  stateStore[stateKey] = state;
  console.log("Setting linkedinStateKey cookie:", stateKey, "with state:", state); 
  res.cookie('linkedinStateKey', stateKey, { 
    httpOnly: true, 
    secure: false, 
    path: '/', 
    sameSite: 'Lax'
  });
  const linkedinAuthUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent("http://localhost:5000/linkedin-callback")}&state=${state}&scope=openid%20profile%20email`;
  res.redirect(linkedinAuthUrl);
};

const linkedinCallback = async (req, res) => {
  const { code, state, error, error_description } = req.query;

  console.log("LinkedIn Callback Query:", req.query);
  console.log("Cookies received:", req.cookies);

  if (error) {
    console.error("LinkedIn Authorization Error:", error, error_description);
    return res.status(400).json({ message: `LinkedIn error: ${error_description}` });
  }

  if (!code) {
    return res.status(400).json({ message: "Authorization code missing" });
  }

  const stateKey = req.cookies.linkedinStateKey;
  console.log("StateKey from cookie:", stateKey, "StateStore contents:", stateStore);
  if (!stateKey || !stateStore[stateKey]) {
    return res.status(401).json({ message: "Invalid or missing state key for CSRF protection" });
  }

  const storedState = stateStore[stateKey];
  if (state !== storedState) {
    return res.status(401).json({ message: "State parameter modified. CSRF protection failed" });
  }

  delete stateStore[stateKey];
  res.clearCookie('linkedinStateKey');

  try {
    const tokenResponse = await axios.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: "http://localhost:5000/linkedin-callback",
        client_id: process.env.LINKEDIN_CLIENT_ID,
        client_secret: process.env.LINKEDIN_CLIENT_SECRET,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log("Access Token:", accessToken);

    const userInfoResponse = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const linkedinId = userInfoResponse.data.sub;
    const email = userInfoResponse.data.email || null;
    const username = userInfoResponse.data.name || `LinkedIn_${linkedinId}`;

    const user = await handleLinkedInUser(linkedinId, email, username);
    const userId = user._id;

    const token = jwt.sign({ id: userId, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.password = undefined;

  
    res.send(`
      <script>
        window.opener.postMessage({ token: '${token}', user: '${JSON.stringify(user)}' }, 'http://localhost:5173');
        window.close();
      </script>
    `);
  } catch (err) {
    console.error("LinkedIn Callback Error:", err.message, err.response?.data || {});
    if (err.response) {
      const status = err.response.status || 500;
      return res.status(status).json({
        message: err.response.data.error_description || "Error with LinkedIn authentication",
        error: err.message,
        details: err.response.data
      });
    }
    res.status(500).json({ message: "Error with LinkedIn authentication", error: err.message });
  }
};
const linkedinCallbackPost = async (req, res) => {
  const { linkedinId, email, username } = req.body;

  console.log("LinkedIn Callback Post Data:", req.body); 

  if (!linkedinId) {
    return res.status(400).json({ message: "LinkedIn ID is required" });
  }

  try {
    const user = await handleLinkedInUser(linkedinId, email, username);


    const userId = user._id;


    const token = jwt.sign({ id: userId, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    user.password = undefined;


    res.json({ token, user });
  } catch (err) {
    console.error("LinkedIn Callback Post Error:", err);
    res.status(500).json({ message: "Error with LinkedIn authentication", error: err.message });
  }
};

const handleLinkedInUser = async (linkedinId, email, username) => {
  try {
    let user = await User.findOne({ 'linkedAccounts.linkedin': linkedinId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
       
        user.linkedAccounts.linkedin = linkedinId;
        await user.save();
      } else {
 
        user = new User({
          userId: new ObjectId(), 
          username: username || `LinkedIn_${linkedinId}`,
          email: email || `linkedin_${linkedinId}@example.com`,
          phoneNumber: "",
          password: bcrypt.hashSync(linkedinId, 10), 
          role: "learner", 
          bio: "",
          location: "",
          linkedAccounts: { linkedin: linkedinId },
          hasChosenSkills: false,
        });
        await user.save();
      }
    }
    return user;
  } catch (err) {
    throw new Error(`Error handling LinkedIn user: ${err.message}`);
  }
};



module.exports = {
  getUserSkillsBySkillId,
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
  finishSkillSelection,
  updateUserSkillById,
  removeUserSkillsBySkillId,
  googleCallback,
  handleGoogleUser,
  linkedinLogin,
  linkedinCallback,
  linkedinCallbackPost,
  handleLinkedInUser,
};