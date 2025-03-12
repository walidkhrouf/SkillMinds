const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const multer = require("multer");

const {
  getAllGroups,
  createGroup,
  createGroupPost,
  getGroupPosts,
  getGroupPostById,
  getMediaFile,
  createGroupPostComment,
  createGroupPostLike,
  removeGroupPostLike,
  createGroupPostDislike,
  removeGroupPostDislike,
  deleteGroupPostComment,
  deleteGroupPost,
  deleteGroup,
  requestToJoinGroup,
  getGroupRequests,
  acceptGroupRequest,
  rejectGroupRequest,
  reportGroup,
  reportPost,
  editGroupPostComment,
  joinGroup,
  editGroup,
  getGroupMembers,
  removeGroupMember,
  leaveGroup,
  checkMembership,
  recommendGroups,
} = require("../Controllers/GestionGroupeController");

const storage = multer.memoryStorage();
const upload = multer({ storage }).array("media", 10);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication token required" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Token not provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token", error: error.message });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired", error: error.message });
    }
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

router.get("/all", authenticateToken, getAllGroups);
router.post("/create", authenticateToken, createGroup);
router.delete("/:groupId", authenticateToken, deleteGroup);
router.post("/posts/create", authenticateToken, upload, createGroupPost);
router.get("/posts/:groupId", authenticateToken, getGroupPosts);
router.get("/posts/:groupId/:postId", authenticateToken, getGroupPostById);
router.post("/posts/:groupId/:postId/report", authenticateToken, reportPost);
router.delete("/posts/:groupId/:postId", authenticateToken, deleteGroupPost);
router.get("/media/:fileId", getMediaFile);
router.post("/posts/:groupId/:postId/comment", authenticateToken, createGroupPostComment);
router.delete("/posts/:groupId/:postId/comment/:commentId", authenticateToken, deleteGroupPostComment);
router.put("/posts/:groupId/:postId/comment/:commentId", authenticateToken, editGroupPostComment);
router.post("/posts/:groupId/:postId/like", authenticateToken, createGroupPostLike);
router.delete("/posts/:groupId/:postId/like", authenticateToken, removeGroupPostLike);
router.post("/posts/:groupId/:postId/dislike", authenticateToken, createGroupPostDislike);
router.delete("/posts/:groupId/:postId/dislike", authenticateToken, removeGroupPostDislike);
router.post("/:groupId/report", authenticateToken, reportGroup);
router.post("/:groupId/leave", authenticateToken, leaveGroup);
router.get("/:groupId/membership", authenticateToken, checkMembership);
router.post("/:groupId/join", authenticateToken, joinGroup); 
router.post("/:groupId/request", authenticateToken, requestToJoinGroup);
router.get("/:groupId/requests", authenticateToken, getGroupRequests);
router.put("/:groupId", authenticateToken, editGroup);
router.put("/:groupId/request/:requestId/accept", authenticateToken, acceptGroupRequest);
router.put("/:groupId/request/:requestId/reject", authenticateToken, rejectGroupRequest);
router.get("/:groupId/members", authenticateToken, getGroupMembers);
router.delete("/:groupId/members/:memberId", authenticateToken, removeGroupMember);

router.get("/recommend", authenticateToken, recommendGroups);

module.exports = router;