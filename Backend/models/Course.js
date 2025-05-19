const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const videoSchema = new Schema({
  data: { type: Buffer, required: true },
  filename: { type: String, required: true },
  contentType: { type: String, required: true },
  length: { type: Number, required: true },
  order: { type: Number, required: true }
}, { _id: false });

const quizSchema = new Schema({
  courseTitle: { type: String, required: true },
  questions: [{
    text: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctAnswer: { type: Number, required: true, min: 0, max: 3 },
    explanation: { type: String, required: true }
  }]
}, { _id: false });

const courseSchema = new Schema({
  courseId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  skillId: { type: Schema.Types.ObjectId, ref: 'Skill', required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, default: 0 },
  videos: [videoSchema],
  quiz: { type: quizSchema, default: null },
  ratings: [
    {
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true, min: 1, max: 5 }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

courseSchema.pre('validate', function(next) {
  if (!this.courseId) this.courseId = this._id.toString();
  next();
});

module.exports = mongoose.model('Course', courseSchema);