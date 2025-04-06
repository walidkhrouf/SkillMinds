const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');
const { getTotalJobOffers } = require('../Controllers/adminController');


router.post('/skills', adminController.addSkill);
router.get('/skills', adminController.getAllSkills);
router.get('/skillCategories', adminController.getSkillCategories);
router.delete('/skills/:id', adminController.deleteSkill);
router.put('/skills/:id', adminController.updateSkill);
router.get('/skills/:id', adminController.getSkillById);
router.get("/dashboard-stats", adminController.getDashboardStats); 
router.get('/total', getTotalJobOffers);

module.exports = router;
