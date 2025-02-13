const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const mediaSchema = new Schema({
  filename: { type: String },
  contentType: { type: String },
  length: { type: Number },
  fileId: { type: Schema.Types.ObjectId } // Reference to the GridFS file
}, { _id: false });

const tutorialSchema = new Schema({
  tutorialId: { type: String, required: true, unique: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ["Programming", "Business", "Design", "Marketing"], required: true },
  media: [mediaSchema], // Array of media attachments
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tutorial', tutorialSchema);
