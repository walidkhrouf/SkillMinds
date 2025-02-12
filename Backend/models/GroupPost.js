const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupPostSchema = new Schema({
  postId: { type: String, required: true, unique: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupPost', groupPostSchema);