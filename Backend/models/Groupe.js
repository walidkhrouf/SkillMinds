const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  groupId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  privacy: { type: String, enum: ["public", "private"], required: true },
  skillId: { type: Schema.Types.ObjectId, ref: "Skill" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Group', groupSchema);