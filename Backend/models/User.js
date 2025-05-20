const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileImageSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number,
  fileId: { type: String}
}, { _id: false });

const certificateImageSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number,
  fileId: { type: String}
}, { _id: false });

const userSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: String,
  password: { type: String, required: true },
  role: { type: String, enum: ["learner", "mentor", "admin", "unverified mentor"], required: true },
  bio: String,
  location: String,
  profileImage: profileImageSchema,
  certificateImage: { type: [certificateImageSchema], default: [] },
  linkedAccounts: {
    google: String,
    linkedin: String
  },
  hasChosenSkills: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

userSchema.pre('validate', function(next) {
  if (!this.userId) {
    this.userId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
