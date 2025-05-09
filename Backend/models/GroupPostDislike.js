// models/GroupPostDislike.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupPostDislikeSchema = new Schema({
  dislikeId: { type: String, required: true, unique: true },
  groupPostId: { type: Schema.Types.ObjectId, ref: "GroupPost", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});

groupPostDislikeSchema.pre('validate', function(next) {
  if (!this.dislikeId) {
    this.dislikeId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('GroupPostDislike', groupPostDislikeSchema);