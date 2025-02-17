const express = require("express");
const { 
  signup, 
  signin, 
  getUserById, 
  getAllUsers, 
  updateUser, 
  deleteUser, 
  createUserSkills,
  getUserSkills   
} = require("../Controllers/UserController");
const multer = require("multer");
const Skill = require("../models/Skill");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();


router.post("/signup", upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "certificateImage", maxCount: 1 }
]), signup);


router.get("/skills", async (req, res) => {
  try {
    const skills = await Skill.find({});
    res.json(skills);
  } catch (err) {
    res.status(500).json({ message: "Error fetching skills" });
  }
});


router.post("/signin", signin);

router.get("/all", getAllUsers);

router.get("/userskills", getUserSkills);


router.get("/:id", getUserById);


router.put("/:id", updateUser);
router.delete("/:id", deleteUser);


router.post("/userskills", createUserSkills);

module.exports = router;
