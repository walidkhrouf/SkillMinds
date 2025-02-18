const express = require("express");
const { 
  signup, 
  signin, 
  verifyOTP,
  getUserById, 
  getAllUsers, 
  updateUser, 
  deleteUser, 
  createUserSkills,
  updateUserSkills,
  getUserSkills  
  ,forgotPassword,resetPassword  ,deleteUserSkill
} = require("../Controllers/UserController");

const User = require("../models/User");
const multer = require("multer");
const Skill = require("../models/Skill");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();



router.put("/userskills", updateUserSkills);

router.post("/verifyOTP", verifyOTP);
router.put("/:id", upload.single("profileImage"), updateUser);
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

router.post("/signup", upload.single("profileImage"), signup);
router.post("/forgot-password", forgotPassword); 
router.post("/reset-password/:id/:token", resetPassword);
router.get("/all", async (req, res) => {
    try {
      const users = await User.find(); 
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

router.get("/:id", getUserById);

router.put("/:id", upload.single("profileImage"), updateUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

router.delete("/userskills/:skillId", deleteUserSkill);



router.post("/userskills", createUserSkills);

module.exports = router;
