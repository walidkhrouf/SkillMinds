const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const notificationSchema = new Schema({
  notificationId: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: [
      "ACCOUNT_UPDATE", "COURSE_ENROLLMENT", "COURSE_COMPLETION",
      "SKILL_VERIFICATION", "NEW_RECOMMENDATION", "GROUP_ACTIVITY",
      "JOB_APPLICATION_STATUS", "TUTORIAL_INTERACTION", "EVENT_REMINDER",
      "EVENT_CREATION_PAYMENT", "SKILL_REMOVAL",'JOB_OFFER_CREATED', 
      'JOB_OFFER_UPDATED', 
      'JOB_OFFER_DELETED', 
      'JOB_APPLICATION_RECEIVED', "INTERVIEW_DATE_SET",  "INTERVIEW_CONFIRMED_BY_CANDIDATE", // ✅ ajouté
      "INTERVIEW_DECLINED_BY_CANDIDATE",  // ✅ ajouté
      'FINAL_DECISION' // ✅ Ajoute cette ligne
      

    ],
    required: true
  },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

notificationSchema.pre('validate', function(next) {
  if (!this.notificationId) {
    this.notificationId = this._id.toString();
  }
  next();
});

module.exports = mongoose.model('Notification', notificationSchema);