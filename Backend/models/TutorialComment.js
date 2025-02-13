const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tutorialCommentSchema = new Schema({
  commentId: { type: String, required: true, unique: true },
  tutorialId: { type: Schema.Types.ObjectId, ref: "Tutorial", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TutorialComment', tutorialCommentSchema);