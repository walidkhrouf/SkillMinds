const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');




router.post('/skills', adminController.addSkill);
router.get('/skills', adminController.getAllSkills);
router.get('/skillCategories', adminController.getSkillCategories);
router.put('/skills/:id',adminController.updateSkill);
router.get('/skills/:id',  adminController.getSkillById);
router.get("/dashboard-stats", adminController.getDashboardStats);
router.get("/groups/stats", adminController.authenticateAdmin, adminController.getGroupStats);
// Apply the middleware directly in the route definition
router.get("/groups", adminController.authenticateAdmin, adminController.getAllGroupsAdmin);
router.put("/groups/:groupId", adminController.authenticateAdmin, adminController.updateGroupAdmin);
router.delete("/groups/:groupId", adminController.authenticateAdmin, adminController.deleteGroupAdmin);
router.delete("/groups/:groupId/posts/:postId", adminController.authenticateAdmin, adminController.deleteGroupPostAdmin);

module.exports = router;