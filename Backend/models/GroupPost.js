const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const mediaSchema = new Schema({
  filename: { type: String },
  contentType: { type: String },
  length: { type: Number },
  fileId: { type: Schema.Types.ObjectId } 
}, { _id: false });

const groupPostSchema = new Schema({
  postId: { type: String, required: true, unique: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true }, 
  subject: { type: String, required: true },
  content: { type: String, required: true },
  media: [mediaSchema], 
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
  createdAt: { type: Date, default: Date.now }
});
groupPostSchema.pre('validate', function(next) {
  if (!this.postId) {
    this.postId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('GroupPost', groupPostSchema);
