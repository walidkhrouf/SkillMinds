// models/index.js
const User = require('./User');
const Skill = require('./Skill');
const UserSkill = require('./UserSkill');
const SkillVerification = require('./SkillVerification');
const SkillRecommendation = require('./SkillRecommendation');
const SkillFollow = require('./SkillFollow');
const Course = require('./Course');
const CourseEnrollment = require('./CourseEnrollment');
const Group = require('./Groupe');
const GroupPost = require('./GroupPost');
const GroupPostComment = require('./GroupPostComment');
const GroupPostLike = require('./GroupPostLike');
const JobOffer = require('./JobOffer');
const JobApplication = require('./JobApplication');
const Tutorial = require('./Tutorial');
const TutorialComment = require('./TutorialComment');
const TutorialLike = require('./TutorialLike');
const Activity = require('./Activity');
const ActivityParticipant = require('./ActivityParticipant');
const Cart = require('./Cart');
const Payment = require('./Payment');
const Notification = require('./Notification');

module.exports = {
  User,
  Skill,
  UserSkill,
  SkillVerification,
  SkillRecommendation,
  SkillFollow,
  Course,
  CourseEnrollment,
  Group,
  GroupPost,
  GroupPostComment,
  GroupPostLike,
  JobOffer,
  JobApplication,
  Tutorial,
  TutorialComment,
  TutorialLike,
  Activity,
  ActivityParticipant,
  Cart,
  Payment,
  Notification,
};
