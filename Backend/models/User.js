// models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileImageSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number,
  fileId: { type: Schema.Types.ObjectId } // Reference to the GridFS file
}, { _id: false });

const linkedAccountsSchema = new Schema({
  google: String,
  facebook: String
}, { _id: false });

const userSchema = new Schema({
  userId: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phoneNumber: String,
  password: { type: String, required: true },
  role: { type: String, enum: ["learner", "mentor", "admin"], required: true },
  bio: String,
  location: String,
  profileImage: profileImageSchema,
  linkedAccounts: linkedAccountsSchema,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
