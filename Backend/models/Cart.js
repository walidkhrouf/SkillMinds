const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const cartItemSchema = new Schema({
  courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
  price: { type: Number, required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const cartSchema = new Schema({
  cartId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


cartSchema.pre('validate', function(next) {
  if (!this.cartId) {
    this.cartId = this._id.toString();
  }
  next();
});
module.exports = mongoose.model('Cart', cartSchema);