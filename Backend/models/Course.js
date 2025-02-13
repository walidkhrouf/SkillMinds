const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const fileSchema = new Schema({
  filename: String,
  contentType: String,
  length: Number,
  fileId: { type: Schema.Types.ObjectId } // Reference to the GridFS file
}, { _id: false });

const courseSchema = new Schema({
  courseId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: String,
  skillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  price: { type: Number, default: 0 },
  file: fileSchema,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
