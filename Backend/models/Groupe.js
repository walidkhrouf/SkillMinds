const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const groupSchema = new Schema({
  groupId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  privacy: { type: String, enum: ["public", "private"], required: true },
  skillId: { type: Schema.Types.ObjectId, ref: "Skill" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  memberCount: {
    type: Number,
    default: 0,
    min: 0
  },
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
groupSchema.pre('validate', function(next) {
  if (!this.groupId) {
    this.groupId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Group', groupSchema);