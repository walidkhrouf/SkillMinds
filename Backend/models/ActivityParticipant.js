const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activityParticipantSchema = new Schema({
  participantId: { type: String, required: true, unique: true },
  activityId: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  status: { type: String, enum: ["registered", "attended", "canceled"], default: "registered" },
  createdAt: { type: Date, default: Date.now }
});

activityParticipantSchema.pre('validate', function(next) {
  if (!this.participantId) {
    this.participantId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('ActivityParticipant', activityParticipantSchema);