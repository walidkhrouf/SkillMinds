const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillFollowSchema = new Schema({
  followId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SkillFollow', skillFollowSchema);