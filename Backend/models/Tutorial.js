const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mediaSchema = new Schema({
  data: { type: String }, 
  contentType: { type: String }, 
  length: { type: Number }, 
}, { _id: false });

const tutorialSchema = new Schema({
  tutorialId: { type: String, required: true, unique: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  media: [mediaSchema],
  createdAt: { type: Date, default: Date.now }
});

tutorialSchema.pre('validate', function(next) {
  if (!this.tutorialId) {
    this.tutorialId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Tutorial', tutorialSchema);