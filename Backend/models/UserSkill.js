const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const achievementSchema = new Schema({
  badgeName: String,
  awardedAt: Date
}, { _id: false });

const userSkillSchema = new Schema({
  userSkillId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
  skillType: { type: String, enum: ["has", "wantsToLearn"], required: true },
  verificationStatus: { type: String, enum: ["unverified", "pending", "verified"], default: "unverified" },
  learningGoals: String,
  achievements: [achievementSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserSkill', userSkillSchema);