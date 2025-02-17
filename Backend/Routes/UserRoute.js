const express = require("express");
const { signup,signin, getUserById, getAllUsers, updateUser, deleteUser } = require("../Controllers/UserController");
const multer = require("multer");

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();

// Accept two file fields: profileImage and certificateImage
router.post("/signup", upload.fields([
  { name: "profileImage", maxCount: 1 },
  { name: "certificateImage", maxCount: 1 }
]), signup);


router.post("/signin",signin)
router.get("/all", getAllUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

module.exports = router;
