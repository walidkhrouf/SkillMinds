const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const courseEnrollmentSchema = new Schema({
  enrollmentId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  status: { type: String, enum: ["enrolled", "in-progress", "completed"], default: "enrolled" },
  createdAt: { type: Date, default: Date.now },
  completedAt: Date
});
courseEnrollmentSchema.pre('validate', function(next) {
  if (!this.enrollmentId) {
    this.enrollmentId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('CourseEnrollment', courseEnrollmentSchema);