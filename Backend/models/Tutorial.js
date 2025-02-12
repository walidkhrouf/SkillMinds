const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tutorialSchema = new Schema({
  tutorialId: { type: String, required: true, unique: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ["Programming", "Business", "Design", "Marketing"], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tutorial', tutorialSchema);