const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupPostCommentSchema = new Schema({
  commentId: { type: String, required: true, unique: true },
  groupPostId: { type: Schema.Types.ObjectId, ref: "GroupPost", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  reports: [
    {
      userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      reason: {
        type: String,
        required: true,
        enum: ["Inappropriate Content", "Spam", "Off-Topic", "Harassment", "Other"],
      },
      details: { type: String, maxlength: 500 },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});
groupPostCommentSchema.pre('validate', function(next) {
  if (!this.commentId) {
    this.commentId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('GroupPostComment', groupPostCommentSchema);