const express = require('express');
const router = express.Router();
const adminController = require('../Controllers/adminController');

router.post('/skills', adminController.addSkill);
router.get('/skills', adminController.getAllSkills);
router.get('/skillCategories', adminController.getSkillCategories);
router.delete('/skills/:id', adminController.deleteSkill);
router.put('/skills/:id', adminController.updateSkill);

module.exports = router;
