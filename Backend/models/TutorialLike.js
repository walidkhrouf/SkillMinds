const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tutorialLikeSchema = new Schema({
  likeId: { type: String, required: true, unique: true },
  tutorialId: { type: Schema.Types.ObjectId, ref: "Tutorial", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

tutorialLikeSchema.pre('validate', function(next) {
  if (!this.likeId) {
    this.likeId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('TutorialLike', tutorialLikeSchema);