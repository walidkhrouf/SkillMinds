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
const Tutorial = require("../models/Tutorial");
const TutorialComment = require("../models/TutorialComment");
const TutorialLike = require("../models/TutorialLike");
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
    const validCategories = Skill.schema.path('category').options.enum;
    if (!validCategories.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }
    const newSkill = new Skill({ name, category, description, tags: tags || [] });
    const savedSkill = await newSkill.save();
    return res.status(201).json(savedSkill);
  } catch (error) {
    console.error("Error adding skill:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getGroupStats = async (req, res) => {
  try {
    const totalGroups = await Group.countDocuments();
    const totalPosts = await GroupPost.countDocuments();
    const totalComments = await GroupPostComment.countDocuments();
    const totalLikes = await GroupPostLike.countDocuments();
    const totalDislikes = await GroupPostDislike.countDocuments();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const groupActivityOverTime = await GroupPost.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          posts: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const mostActiveGroups = await GroupPost.aggregate([
      {
        $group: {
          _id: "$groupId",
          postCount: { $sum: 1 },
        },
      },
      { $sort: { postCount: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "groups", // Corrected from "Groupe" to "groups"
          localField: "_id",
          foreignField: "_id",
          as: "group",
        },
      },
      { $unwind: "$group" },
      {
        $project: {
          name: "$group.name",
          postCount: 1,
        },
      },
    ]);
    const privacyDistribution = await Group.aggregate([
      {
        $group: {
          _id: "$privacy",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          name: "$_id",
          value: "$count",
        },
      },
    ]);
    const avgEngagementPerPost = totalPosts > 0 ? (totalLikes + totalComments) / totalPosts : 0;
    const topGroupsByMembers = await Group.find()
        .sort({ memberCount: -1 })
        .limit(5)
        .select("name memberCount")
        .lean();

    res.status(200).json({
      totalGroups,
      totalPosts,
      totalComments,
      totalLikes,
      totalDislikes,
      groupActivityOverTime,
      mostActiveGroups,
      privacyDistribution,
      avgEngagementPerPost: parseFloat(avgEngagementPerPost.toFixed(2)),
      topGroupsByMembers,
    });
  } catch (error) {
    console.error("Error fetching group stats:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
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
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({ message: "Invalid skill ID format" });
  }
  try {
    const skill = await Skill.findById(id);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    res.status(200).json(skill);
  } catch (error) {
    console.error("Error retrieving skill:", error.message);
    res.status(500).json({ message: "Error retrieving skill", error: error.message });
  }
};

exports.deleteSkill = async (req, res) => {
  const { id } = req.params;
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({ message: "Invalid skill ID format" });
  }
  try {
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
  const { id } = req.params;
  if (!objectIdRegex.test(id)) {
    return res.status(400).json({ message: "Invalid skill ID format" });
  }
  try {
    const { name, category, description, tags } = req.body;
    const validCategories = Skill.schema.path('category').options.enum;
    if (category && !validCategories.includes(category)) {
      return res.status(400).json({ message: `Invalid category. Must be one of: ${validCategories.join(', ')}` });
    }
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
      { $limit: 5 }, // Added limit
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
    const totalTutorials = await Tutorial.countDocuments();
    const tutorialCategoriesStats = await Tutorial.aggregate([
      { $group: { _id: "$category", value: { $sum: 1 } } },
      { $project: { name: "$_id", value: 1, _id: 0 } },
    ]);
    const totalTutorialLikes = await TutorialLike.countDocuments();
    const totalTutorialComments = await TutorialComment.countDocuments();

    const stats = {
      users: { total: totalUsers, roles: rolesStats },
      courses: { total: totalSkills, categories: categoriesStats },
      skills: { total: totalSkills, trending: trendingSkills.map((skill) => skill.name) },
      tutorials: {
        total: totalTutorials,
        categories: tutorialCategoriesStats,
        totalLikes: totalTutorialLikes,
        totalComments: totalTutorialComments,
      },
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

exports.getAllTutorialsAdmin = async (req, res) => {
  try {
    const tutorials = await Tutorial.find()
        .populate("authorId", "username email")
        .sort({ createdAt: -1 })
        .lean();

    const tutorialDetails = await Promise.all(
        tutorials.map(async (tutorial) => {
          try {
            const likesCount = await TutorialLike.countDocuments({ tutorialId: tutorial._id });
            const commentsCount = await TutorialComment.countDocuments({ tutorialId: tutorial._id });
            const comments = await TutorialComment.find({ tutorialId: tutorial._id })
                .populate("userId", "username")
                .lean();
            return {
              ...tutorial,
              likesCount,
              commentsCount,
              comments,
            };
          } catch (error) {
            console.error(`Error processing tutorial ${tutorial._id}:`, error.message);
            return {
              ...tutorial,
              likesCount: 0,
              commentsCount: 0,
              comments: [],
              error: "Failed to fetch details",
            };
          }
        })
    );

    res.status(200).json(tutorialDetails);
    } catch (error) {
    console.error("Error fetching tutorials for admin:", error.message);
  }

  }
   getTutorialStats = async (req, res) => {
    try {
      const totalTutorials = await Tutorial.countDocuments();
      const totalComments = await TutorialComment.countDocuments();
      const totalLikes = await TutorialLike.countDocuments();

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const tutorialActivityOverTime = await Tutorial.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            tutorials: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const categoryDistribution = await Tutorial.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            name: "$_id",
            value: "$count",
          },
        },
      ]);

      const avgEngagementPerTutorial = totalTutorials > 0 ? (totalLikes + totalComments) / totalTutorials : 0;

      const topTutorialsByLikes = await TutorialLike.aggregate([
        {
          $group: {
            _id: "$tutorialId",
            likeCount: { $sum: 1 },
          },
        },
        { $sort: { likeCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "tutorials",
            localField: "_id",
            foreignField: "_id",
            as: "tutorial",
          },
        },
        { $unwind: "$tutorial" },
        { $match: { "tutorial": { $exists: true } } }, // Ensure tutorial exists
        {
          $project: {
            title: "$tutorial.title",
            likeCount: 1,
          },
        },
      ]);

      res.status(200).json({
        totalTutorials,
        totalComments,
        totalLikes,
        tutorialActivityOverTime,
        categoryDistribution,
        avgEngagementPerTutorial: parseFloat(avgEngagementPerTutorial.toFixed(2)),
        topTutorialsByLikes,
      });
    } catch (error) {
      console.error("Error fetching tutorial stats:", error.message);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };

exports.deleteTutorialAdmin = async (req, res) => {
  const { tutorialId } = req.params;

  if (!objectIdRegex.test(tutorialId)) {
    return res.status(400).json({ message: "Invalid tutorialId format" });
  }

  try {
    const userRole = req.user.role;
    if (userRole !== "admin") {
      return res.status(403).json({ message: "Only admins can delete tutorials" });
    }

    // Search by _id since tutorialId is a string in Tutorial model
    const tutorial = await Tutorial.findOne({ _id: tutorialId });
    if (!tutorial) {
      return res.status(404).json({ message: "Tutorial not found" });
    }

    // Delete the tutorial and related content
    await Promise.all([
      Tutorial.deleteOne({ _id: tutorialId }),
      TutorialComment.deleteMany({ tutorialId }),
      TutorialLike.deleteMany({ tutorialId })
    ]);

    // Create notification with error handling
    try {
      const notification = new Notification({
        userId: tutorial.authorId,
        type: "TUTORIAL_ACTIVITY",
        message: `Your tutorial "${tutorial.title}" has been deleted by an admin.`,
      });
      await notification.save();
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError.message);
      // Continue with success response even if notification fails
    }

    res.status(200).json({ message: "Tutorial deleted successfully", tutorialId });
  } catch (error) {
    console.error("Error deleting tutorial:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

  exports.getAllTutorialsAdmin = async (req, res) => {
    try {
      const tutorials = await Tutorial.find()
          .populate("authorId", "username email")
          .sort({ createdAt: -1 })
          .lean();

      const tutorialDetails = await Promise.all(
          tutorials.map(async (tutorial) => {
            try {
              const likesCount = await TutorialLike.countDocuments({ tutorialId: tutorial._id });
              const commentsCount = await TutorialComment.countDocuments({ tutorialId: tutorial._id });
              const comments = await TutorialComment.find({ tutorialId: tutorial._id })
                  .populate("userId", "username")
                  .lean();
              return {
                ...tutorial,
                likesCount,
                commentsCount,
                comments,
              };
            } catch (error) {
              console.error(`Error processing tutorial ${tutorial._id}:`, error.message);
              return {
                ...tutorial,
                likesCount: 0,
                commentsCount: 0,
                comments: [],
                error: "Failed to fetch details",
              };
            }
          })
      );

      res.status(200).json(tutorialDetails);
    } catch (error) {
      console.error("Error fetching tutorials for admin:", error.message);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };

  exports.getTutorialStats = async (req, res) => {
    try {
      const totalTutorials = await Tutorial.countDocuments();
      const totalComments = await TutorialComment.countDocuments();
      const totalLikes = await TutorialLike.countDocuments();

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const tutorialActivityOverTime = await Tutorial.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            tutorials: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      const categoryDistribution = await Tutorial.aggregate([
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            name: "$_id",
            value: "$count",
          },
        },
      ]);

      const avgEngagementPerTutorial = totalTutorials > 0 ? (totalLikes + totalComments) / totalTutorials : 0;

      const topTutorialsByLikes = await TutorialLike.aggregate([
        {
          $group: {
            _id: "$tutorialId",
            likeCount: { $sum: 1 },
          },
        },
        { $sort: { likeCount: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "tutorials",
            localField: "_id",
            foreignField: "_id",
            as: "tutorial",
          },
        },
        { $unwind: "$tutorial" },
        { $match: { "tutorial": { $exists: true } } }, // Ensure tutorial exists
        {
          $project: {
            title: "$tutorial.title",
            likeCount: 1,
          },
        },
      ]);

      res.status(200).json({
        totalTutorials,
        totalComments,
        totalLikes,
        tutorialActivityOverTime,
        categoryDistribution,
        avgEngagementPerTutorial: parseFloat(avgEngagementPerTutorial.toFixed(2)),
        topTutorialsByLikes,
      });
    } catch (error) {
      console.error("Error fetching tutorial stats:", error.message);
      res.status(500).json({ message: "Internal server error", error: error.message });
    }
  };

exports.getTutorialDynamicStats = async (req, res) => {
  try {
    // 1. Tutorials Created Over Time (last 12 months)
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const tutorialsOverTime = await Tutorial.aggregate([
      {
        $match: {
          createdAt: { $gte: twelveMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      {
        $project: {
          name: {
            $concat: [
              { $toString: '$_id.month' },
              '/',
              { $toString: '$_id.year' },
            ],
          },
          count: 1,
          _id: 0,
        },
      },
    ]);

    // 2. Tutorial Category Distribution
    const categoryDistribution = await Tutorial.aggregate([
      {
        $group: {
          _id: '$category',
          value: { $sum: 1 },
        },
      },
      {
        $project: {
          name: '$_id',
          value: 1,
          _id: 0,
        },
      },
      {
        $sort: { value: -1 },
      },
    ]);

    // 3. Average Engagement Metrics (Likes and Comments)
    const totalTutorials = await Tutorial.countDocuments();
    const engagementMetrics = await Promise.all([
      // Average Likes
      TutorialLike.aggregate([
        {
          $group: {
            _id: '$tutorialId',
            likes: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            avgLikes: { $avg: '$likes' },
          },
        },
        {
          $project: {
            name: 'Likes',
            value: { $round: ['$avgLikes', 2] },
            _id: 0,
          },
        },
      ]),
      // Average Comments
      TutorialComment.aggregate([
        {
          $group: {
            _id: '$tutorialId',
            comments: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            avgComments: { $avg: '$comments' },
          },
        },
        {
          $project: {
            name: 'Comments',
            value: { $round: ['$avgComments', 2] },
            _id: 0,
          },
        },
      ]),
    ]);

    const stats = {
      tutorialsOverTime: tutorialsOverTime.length ? tutorialsOverTime : [{ name: 'No Data', count: 0 }],
      categoryDistribution: categoryDistribution.length ? categoryDistribution : [{ name: 'No Data', value: 0 }],
      engagementMetrics: engagementMetrics.flat().length ? engagementMetrics.flat() : [{ name: 'No Data', value: 0 }],
      totalTutorials: totalTutorials,
    };

    res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching tutorial dynamic stats:', error);
    res.status(500).json({ message: 'Failed to fetch tutorial stats', error: error.message });
  }
};