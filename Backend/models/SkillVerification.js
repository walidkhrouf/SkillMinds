const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const evidenceSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number
}, { _id: false });

const skillVerificationSchema = new Schema({
  verificationId: { type: String, required: true, unique: true },
  userSkillId: { type: Schema.Types.ObjectId, ref: "UserSkill", required: true },
  method: { type: String, enum: ["test", "mentor_review", "certification"], required: true },
  status: { type: String, enum: ["pending", "verified", "rejected"], default: "pending" },
  quizScore: Number,
  evidence: [evidenceSchema],
  requestedMentor: { type: Schema.Types.ObjectId, ref: "User" },
  reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SkillVerification', skillVerificationSchema);