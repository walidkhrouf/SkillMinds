const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillSchema = new Schema({
  skillId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { type: String, enum: ["Technical", "Soft Skill", "Management", "Design"], required: true },
  description: { type: String, required: true },
  tags: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Skill', skillSchema);