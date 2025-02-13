const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define a sub-schema for media attachments (e.g., images, videos)
const mediaSchema = new Schema({
  filename: { type: String },
  contentType: { type: String },
  length: { type: Number },
  fileId: { type: Schema.Types.ObjectId } // Reference to the file in GridFS
}, { _id: false });

const groupPostSchema = new Schema({
  postId: { type: String, required: true, unique: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  media: [mediaSchema], // Add an array of media attachments
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupPost', groupPostSchema);
