const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const activitySchema = new Schema({
  activityId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ["Workshop", "Webinar", "Meetup", "Training"], required: true },
  date: { type: Date, required: true },
  location: String,
  isPaid: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now }
});
activitySchema.pre('validate', function(next) {
  if (!this.activityId) {
    this.activityId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Activity', activitySchema);