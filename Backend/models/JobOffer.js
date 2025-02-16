const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const jobOfferSchema = new Schema({
  jobId: { type: String, required: true, unique: true },
  postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: [{ type: Schema.Types.ObjectId, ref: "Skill" }],
  experienceLevel: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], required: true },
  jobType: { type: String, enum: ["Full-Time", "Part-Time", "Freelance", "Internship"], required: true },
  location: String,
  salaryRange: String,
  status: { type: String, enum: ["open", "closed"], default: "open" },
  createdAt: { type: Date, default: Date.now }
});
jobOfferSchema.pre('validate', function(next) {
  if (!this.jobId) {
    this.jobId = this._id.toString();
  }
  next();
});


module.exports = mongoose.model('JobOffer', jobOfferSchema);