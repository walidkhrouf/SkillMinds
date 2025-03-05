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
  content: { type: String, required: true },
  media: [mediaSchema], 
  createdAt: { type: Date, default: Date.now }
});
groupPostSchema.pre('validate', function(next) {
  if (!this.postId) {
    this.postId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('GroupPost', groupPostSchema);
