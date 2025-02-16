const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillSchema = new Schema({
  skillId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: [
      "Technical",
      "Software Development",
      "Data Science",
      "Artificial Intelligence",
      "Cybersecurity",
      "Cloud Computing",
      "DevOps",
      "Soft Skill",
      "Communication",
      "Leadership",
      "Management",
      "Project Management",
      "Design",
      "UI/UX Design",
      "Graphic Design",
      "Marketing",
      "Sales",
      "Finance",
      "Operations",
      "Customer Service",
      "Human Resources",
      "Legal",
      "Research",
      "Product Management"
    ], 
    required: true 
  },

  description: { type: String, required: true },
  tags: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

skillSchema.pre('validate', function(next) {
  if (!this.skillId) {
    this.skillId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Skill', skillSchema);
