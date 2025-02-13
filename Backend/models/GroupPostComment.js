const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupPostCommentSchema = new Schema({
  commentId: { type: String, required: true, unique: true },
  groupPostId: { type: Schema.Types.ObjectId, ref: "GroupPost", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupPostComment', groupPostCommentSchema);