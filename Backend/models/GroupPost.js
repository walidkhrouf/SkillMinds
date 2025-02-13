const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Sub-schema for media files (e.g., images, videos)
const mediaSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number,
  fileId: { type: Schema.Types.ObjectId } // Reference to the GridFS file
}, { _id: false });

const groupPostSchema = new Schema({
  postId: { type: String, required: true, unique: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  // Array to hold one or more media files (optional)
  media: [mediaSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupPost', groupPostSchema);
