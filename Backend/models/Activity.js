const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventImageSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number,
  fileId: { type: Schema.Types.ObjectId }
}, { _id: false });

const activitySchema = new Schema({
  activityId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ["Workshop", "Webinar", "Meetup", "Training"], required: true },
  date: { type: Date, required: true },
  location: String,
  numberOfPlaces: { type: Number, default: 0 },
  eventImage: eventImageSchema,
  isPaid: { type: Boolean, default: false },
  amount: { type: Number },
  link: { type: String },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }], // Added this line
  createdAt: { type: Date, default: Date.now }
});

activitySchema.pre('validate', function(next) {
  if (!this.activityId) {
    this.activityId = this._id.toString();
  }
  
  // Validate amount if isPaid is true
  if (this.isPaid && (this.amount === undefined || this.amount === null)) {
    return next(new Error('Amount is required when the activity is paid.'));
  }

  // Validate link if category is Webinar
  if (this.category === 'Webinar' && (!this.link || this.link.trim() === '')) {
    return next(new Error('Link is required for webinars.'));
  }
  
  next();
});

module.exports = mongoose.model('Activity', activitySchema);