const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillFollowSchema = new Schema({
  followId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  skillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
  createdAt: { type: Date, default: Date.now }
});

skillFollowSchema.pre('validate', function(next) {
  if (!this.followId) {
    this.followId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('SkillFollow', skillFollowSchema);
