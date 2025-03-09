const Skill = require('../models/Skill');
const User = require("../models/User");
const UserSkill = require("../models/UserSkill");
const Group = require("../models/Groupe"); 
const GroupMember = require("../models/GroupMember"); 
const GroupPost = require("../models/GroupPost"); 
const GroupPostLike = require("../models/GroupPostLike"); 
const GroupPostDislike = require("../models/GroupPostDislike"); 
const GroupPostComment = require("../models/GroupPostComment"); 
const GroupRequest = require("../models/GroupRequest"); 
const Notification = require("../models/Notification"); 
const jwt = require("jsonwebtoken"); 


const objectIdRegex = /^[0-9a-fA-F]{24}$/; 

exports.authenticateAdmin = (req, res, next) => {
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
    
   
    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

   
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

exports.addSkill = async (req, res) => {
  try {
    const { name, category, description, tags } = req.body;
    if (!name || !category || !description) {
      return res.status(400).json({ message: "Name, category, and description are required." });
    }
    const newSkill = new Skill({ name, category, description, tags: tags || [] });
    const savedSkill = await newSkill.save();
    return res.status(201).json(savedSkill);
  } catch (error) {
    console.error("Error adding skill:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getSkillCategories = (req, res) => {
  try {
    const categories = Skill.schema.path('category').options.enum;
    return res.json(categories);
  } catch (error) {
    console.error("Error retrieving categories:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    return res.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getSkillById = async (req, res) => {
  const { id } = req.params;
  try {
    const skill = await Skill.findById(id);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    res.status(200).json(skill);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving skill", error: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Skill.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Skill not found" });
    }
    return res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, tags } = req.body;
    const updatedSkill = await Skill.findByIdAndUpdate(
      id,
      { name, category, description, tags: tags || [] },
      { new: true }
    );
    if (!updatedSkill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    return res.json(updatedSkill);
  } catch (error) {
    console.error("Error updating skill:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const rolesStats = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } },
      { $project: { role: "$_id", count: 1, _id: 0 } },
    ]);
    const categoriesStats = await Skill.aggregate([
      { $group: { _id: "$category", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } },
    ]);
    const totalSkills = await Skill.countDocuments();
    const trendingSkills = await UserSkill.aggregate([
      { $match: { skillType: "has" } },
      { $group: { _id: "$skillId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      {
        $lookup: {
          from: "skills",
          localField: "_id",
          foreignField: "_id",
          as: "skill",
        },
      },
      { $unwind: "$skill" },
      { $project: { name: "$skill.name", _id: 0 } },
    ]);

    const stats = {
      users: { total: totalUsers, roles: rolesStats },
      courses: { total: totalSkills, categories: categoriesStats },
      skills: { total: totalSkills, trending: trendingSkills.map((skill) => skill.name) },
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.getAllGroupsAdmin = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("createdBy", "username")
      .lean();

    const groupDetails = await Promise.all(
      groups.map(async (group) => {
        const memberCount = await GroupMember.countDocuments({ groupId: group._id });
        const members = await GroupMember.find({ groupId: group._id })
          .populate("userId", "username")
          .lean();
        const posts = await GroupPost.find({ groupId: group._id })
          .populate("userId", "username")
          .lean();
        const postCount = posts.length;
        const reportCount = group.reports.length;

        const postsWithStats = await Promise.all(
          posts.map(async (post) => {
            const likesCount = await GroupPostLike.countDocuments({ groupPostId: post._id });
            const dislikesCount = await GroupPostDislike.countDocuments({ groupPostId: post._id });
            const commentsCount = await GroupPostComment.countDocuments({ groupPostId: post._id });
            return {
              ...post,
              likesCount,
              dislikesCount,
              commentsCount,
            };
          })
        );

        return {
          ...group,
          memberCount,
          members: members.map((m) => ({ id: m.userId._id, username: m.userId.username })),
          postCount,
          reportCount,
          posts: postsWithStats,
        };
      })
    );

    res.status(200).json(groupDetails);
  } catch (error) {
    console.error("Error fetching groups for admin:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.updateGroupAdmin = async (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }
  if (!name || !name.trim()) {
    return res.status(400).json({ message: "Name is required" });
  }

  try {
    const userRole = req.user.role;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Only admins can update groups" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    group.name = name.trim();
    await group.save();

    res.status(200).json({ message: "Group updated successfully", group });
  } catch (error) {
    console.error("Error updating group:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};


exports.deleteGroupAdmin = async (req, res) => {
  const { groupId } = req.params;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userRole = req.user.role;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Only admins can delete groups" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const posts = await GroupPost.find({ groupId });
    const postIds = posts.map((post) => post._id);

    await Group.deleteOne({ _id: groupId });
    await GroupPost.deleteMany({ groupId });
    await GroupPostComment.deleteMany({ groupPostId: { $in: postIds } });
    await GroupPostLike.deleteMany({ groupPostId: { $in: postIds } });
    await GroupPostDislike.deleteMany({ groupPostId: { $in: postIds } });
    await GroupMember.deleteMany({ groupId });
    await GroupRequest.deleteMany({ groupId });

    const notification = new Notification({
      userId: group.createdBy,
      type: "GROUP_ACTIVITY",
      message: `Your group "${group.name}" has been deleted by an admin.`,
    });
    await notification.save();

    res.status(200).json({ message: "Group deleted successfully", groupId });
  } catch (error) {
    console.error("Error deleting group:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

exports.deleteGroupPostAdmin = async (req, res) => {
  const { groupId, postId } = req.params;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const post = await GroupPost.findOne({ _id: postId, groupId });
    if (!post) {
      return res.status(404).json({ message: "Post not found in this group" });
    }

    await GroupPost.deleteOne({ _id: postId });
    await GroupPostComment.deleteMany({ groupPostId: postId });
    await GroupPostLike.deleteMany({ groupPostId: postId });
    await GroupPostDislike.deleteMany({ groupPostId: postId });

    const notification = new Notification({
      userId: post.userId,
      type: "GROUP_ACTIVITY",
      message: `Your post "${post.title}" in group "${group.name}" has been deleted by an admin.`,
    });
    await notification.save();

    res.status(200).json({ message: "Post deleted successfully", postId });
  } catch (error) {
    console.error("Error deleting group post:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};