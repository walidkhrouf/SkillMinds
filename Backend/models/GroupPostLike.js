const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupPostLikeSchema = new Schema({
  likeId: { type: String, required: true, unique: true },
  groupPostId: { type: Schema.Types.ObjectId, ref: "GroupPost", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GroupPostLike', groupPostLikeSchema);