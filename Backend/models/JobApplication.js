const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const resumeSchema = new Schema({
  data: { type: Buffer, required: true }, // Store the file content as binary data
  contentType: { type: String, required: true }, // MIME type (e.g., 'application/pdf')
  filename: { type: String, required: true }, // Original filename for reference
  length: { type: Number, required: true } // File size in bytes
}, { _id: false });

const jobApplicationSchema = new Schema({
  applicationId: { type: String, required: true, unique: true },
  jobId: { type: Schema.Types.ObjectId, ref: 'JobOffer', required: true },
  applicantId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, required: true },
  resume: resumeSchema,
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'hired'],
    default: 'pending'
  },  createdAt: { type: Date, default: Date.now },
  interviewDate: { type: Date },
  confirmedInterview: { type: String, enum: ['pending', 'confirmed', 'declined'], default: 'pending' },
  meetLink: { type: String },

  
});

jobApplicationSchema.pre('validate', function(next) {
  if (!this.applicationId) this.applicationId = this._id.toString();
  next();
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);