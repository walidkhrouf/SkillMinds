const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define a sub-schema for media files (photo, video, etc.)
const mediaSchema = new Schema({
  filename: { type: String },
  contentType: { type: String },
  length: { type: Number },
  fileId: { type: Schema.Types.ObjectId } // Reference to the file stored in GridFS
}, { _id: false });

const tutorialSchema = new Schema({
  tutorialId: { type: String, required: true, unique: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, enum: ["Programming", "Business", "Design", "Marketing"], required: true },
  // Array to hold media objects; can store multiple photos, videos, etc.
  media: [mediaSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tutorial', tutorialSchema);
