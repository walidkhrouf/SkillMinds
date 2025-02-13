const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
  paymentId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  activityId: { type: Schema.Types.ObjectId, ref: "Activity", required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, enum: ["pending", "completed", "failed"], default: "pending" },
  transactionDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);