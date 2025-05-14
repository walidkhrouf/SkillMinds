const express = require("express");
const router = express.Router();
const tutorialController = require("../Controllers/tutorialController");

router.post("/create", tutorialController.createTutorial);
router.get("/", tutorialController.getAllTutorials);
router.get("/:tutorialId", tutorialController.getTutorialById);
router.put("/:tutorialId", tutorialController.updateTutorial);
router.delete("/:tutorialId", tutorialController.deleteTutorial);
router.post("/:tutorialId/like", tutorialController.likeTutorial);
router.post("/:tutorialId/comment", tutorialController.addComment);
router.post("/generate-image", tutorialController.generateImage);  // Cette ligne doit exister
 console.log("Tutorial routes loaded");

module.exports = router;