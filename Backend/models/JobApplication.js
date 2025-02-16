const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resumeSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number
}, { _id: false });

const jobApplicationSchema = new Schema({
  applicationId: { type: String, required: true, unique: true },
  jobId: { type: Schema.Types.ObjectId, ref: "JobOffer", required: true },
  applicantId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  coverLetter: { type: String, required: true },
  resume: resumeSchema,
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  createdAt: { type: Date, default: Date.now }
});

jobApplicationSchema.pre('validate', function(next) {
  if (!this.applicationId) {
    this.applicationId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);