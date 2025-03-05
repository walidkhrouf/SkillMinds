const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSkillSchema = new Schema({
  userSkillId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
  skillType: { type: String, enum: ["has", "wantsToLearn"], required: true },
  verificationStatus: { type: String, enum: ["unverified", "verified","pending"], default: "unverified" },
  learningGoals: { type: String },
  achievements: [
    {
      badgeName: { type: String },
      awardedAt: { type: Date }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

userSkillSchema.pre('validate', function(next) {
  if (!this.userSkillId) {
    this.userSkillId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('UserSkill', userSkillSchema);
