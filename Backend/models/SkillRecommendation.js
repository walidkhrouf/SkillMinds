const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const skillRecommendationSchema = new Schema({
  recommendationId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  recommendedSkillId: { type: Schema.Types.ObjectId, ref: "Skill", required: true },
  reason: { type: String, enum: ["Trending", "User Interest", "Market Demand"], required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SkillRecommendation', skillRecommendationSchema);