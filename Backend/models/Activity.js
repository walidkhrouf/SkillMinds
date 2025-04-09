const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventImageSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number,
  fileId: { type: Schema.Types.ObjectId }
}, { _id: false });

const commentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

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
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  createdAt: { type: Date, default: Date.now },
  ratings: [{
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    createdAt: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  comments: [commentSchema] 
}, { timestamps: true });

activitySchema.pre('validate', function(next) {
  if (!this.activityId) {
    this.activityId = this._id.toString();
  }
  
  if (this.isPaid && (this.amount === undefined || this.amount === null)) {
    return next(new Error('Amount is required when the activity is paid.'));
  }

  if (this.category === 'Webinar' && (!this.link || this.link.trim() === '')) {
    return next(new Error('Link is required for webinars.'));
  }
  
  next();
});

activitySchema.methods.updateAverageRating = function() {
  if (this.ratings && this.ratings.length > 0) {
    const sum = this.ratings.reduce((total, rating) => total + rating.rating, 0);
    this.averageRating = parseFloat((sum / this.ratings.length).toFixed(1));
  } else {
    this.averageRating = 0;
  }
};

activitySchema.pre('save', function(next) {
  this.updateAverageRating();
  next();
});

module.exports = mongoose.model('Activity', activitySchema);