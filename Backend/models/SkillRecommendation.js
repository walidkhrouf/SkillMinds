const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillRecommendationSchema = new Schema({
  recommendationId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recommendedSkillId: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },
  reason: { type: String, enum: ["Trending", "User Interest", "Market Demand"], required: true },
  createdAt: { type: Date, default: Date.now }
});

skillRecommendationSchema.pre('validate', function(next) {
  if (!this.recommendationId) {
    this.recommendationId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('SkillRecommendation', skillRecommendationSchema);
