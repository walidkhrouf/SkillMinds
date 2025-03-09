const Group = require("../models/Groupe");
const GroupPost = require("../models/GroupPost");
const GroupPostComment = require("../models/GroupPostComment");
const GroupPostLike = require("../models/GroupPostLike");
const GroupPostDislike = require("../models/GroupPostDislike");
const Notification = require("../models/Notification");
const GroupRequest = require("../models/GroupRequest");
const GroupMember = require("../models/GroupMember");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const axios = require("axios");

const conn = mongoose.connection;
let gfs;
conn.once('open', () => {
  gfs = new GridFSBucket(conn.db, { bucketName: 'uploads' });
});

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const createGroup = async (req, res) => {
  const { name, description, privacy, skillId } = req.body;

  if (!name || !description || !privacy) {
    return res.status(400).json({ message: "Name, description, and privacy are required" });
  }
  if (!["public", "private"].includes(privacy)) {
    return res.status(400).json({ message: "Privacy must be 'public' or 'private'" });
  }

  try {
    const userId = req.user.id;
    const newGroup = new Group({
      name: name.trim(),
      description: description.trim(),
      privacy,
      skillId: skillId || null,
      createdBy: userId,
    });

    await newGroup.save();

    const notification = new Notification({
      userId,
      type: "GROUP_ACTIVITY",
      message: `Your group "${name}" has been created successfully!`,
    });
    await notification.save();

    res.status(201).json({ message: "Group created successfully", group: newGroup });
  } catch (error) {
    console.error("Error creating group:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getAllGroups = async (req, res) => {
  try {
    const groups = await Group.find()
      .populate("createdBy", "_id username")
      .lean();

    const groupDetails = await Promise.all(
      groups.map(async (group) => {
        const posts = await GroupPost.find({ groupId: group._id })
          .populate("userId", "username")
          .lean();

        const enrichedPosts = await Promise.all(
          posts.map(async (post) => ({
            ...post,
            likesCount: await GroupPostLike.countDocuments({ groupPostId: post._id }),
            dislikesCount: await GroupPostDislike.countDocuments({ groupPostId: post._id }),
            commentsCount: await GroupPostComment.countDocuments({ groupPostId: post._id }),
          }))
        );

        return {
          ...group,
          memberCount: group.memberCount || 0,
          postCount: posts.length,
          posts: enrichedPosts,
        };
      })
    );

    res.status(200).json(groupDetails);
  } catch (error) {
    console.error("Error fetching groups:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const deleteGroup = async (req, res) => {
  const { groupId } = req.params;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this group" });
    }

    const posts = await GroupPost.find({ groupId });
    const postIds = posts.map((post) => post._id);

    await Group.deleteOne({ _id: groupId });
    await GroupPost.deleteMany({ groupId });
    await GroupPostComment.deleteMany({ groupPostId: { $in: postIds } });
    await GroupPostLike.deleteMany({ groupPostId: { $in: postIds } });
    await GroupPostDislike.deleteMany({ groupPostId: { $in: postIds } });

    const notification = new Notification({
      userId,
      type: "GROUP_ACTIVITY",
      message: `Your group "${group.name}" has been successfully deleted.`,
    });
    await notification.save();

    res.status(200).json({ message: "Group deleted successfully", groupId });
  } catch (error) {
    console.error("Error deleting group:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const createGroupPost = async (req, res) => {
  const { title, subject, content, groupId } = req.body;
  const mediaFiles = req.files;

  if (!title || !subject || !content || !groupId) {
    return res.status(400).json({ message: "Title, subject, content, and groupId are required" });
  }
  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userId = req.user.id;
    const media = [];
    if (mediaFiles && mediaFiles.length > 0) {
      for (const file of mediaFiles) {
        const fileUpload = await new Promise((resolve, reject) => {
          const uploadStream = gfs.openUploadStream(file.originalname, {
            contentType: file.mimetype,
          });
          uploadStream.on("error", (error) => reject(error));
          uploadStream.on("finish", () => {
            resolve({
              filename: file.originalname,
              contentType: file.mimetype,
              length: file.size,
              fileId: uploadStream.id,
            });
          });
          uploadStream.end(file.buffer);
        });
        media.push(fileUpload);
      }
    }

    const newPost = new GroupPost({
      groupId,
      userId,
      title: title.trim(),
      subject: subject.trim(),
      content: content.trim(),
      media,
    });

    await newPost.save();

    const group = await Group.findById(groupId).select("createdBy name").lean();
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== userId.toString()) {
      const notification = new Notification({
        userId: group.createdBy,
        type: "GROUP_ACTIVITY",
        message: `Your group "${group.name}" has a new post titled "${title}"!`,
      });
      await notification.save();
    }

    res.status(201).json({ message: "Post created successfully", post: newPost });
  } catch (error) {
    console.error("Error creating group post:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getMediaFile = async (req, res) => {
  const { fileId } = req.params;

  if (!objectIdRegex.test(fileId)) {
    return res.status(400).json({ message: "Invalid fileId format" });
  }

  if (!gfs) {
    return res.status(500).json({ message: "Media storage not initialized" });
  }

  try {
    const downloadStream = gfs.openDownloadStream(new mongoose.Types.ObjectId(fileId));
    downloadStream.on("error", () => {
      res.status(404).json({ message: "File not found" });
    });
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Error fetching media file:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getGroupPosts = async (req, res) => {
  const { groupId } = req.params;
  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }
  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.privacy === "private" && group.createdBy.toString() !== userId.toString()) {
      const isMember = await GroupMember.findOne({ groupId, userId });
      if (!isMember) {
        return res.status(403).json({ message: "You must be a member to view posts in this private group" });
      }
    }

    const posts = await GroupPost.find({ groupId })
      .populate("userId", "username")
      .lean();
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching group posts:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getGroupPostById = async (req, res) => {
  const { groupId, postId } = req.params;
  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }
  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId })
      .populate("userId", "username")
      .lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comments = await GroupPostComment.find({ groupPostId: post._id })
      .populate("userId", "username")
      .lean();
    const likes = await GroupPostLike.find({ groupPostId: post._id }).lean();
    const dislikes = await GroupPostDislike.find({ groupPostId: post._id }).lean();
    const group = await Group.findById(groupId).select("createdBy").lean();

    const hasLiked = likes.some((like) => like.userId.toString() === userId.toString());
    const hasDisliked = dislikes.some((dislike) => dislike.userId.toString() === userId.toString());
    const isGroupOwner = group.createdBy.toString() === userId.toString();

    res.status(200).json({
      ...post,
      comments,
      likesCount: likes.length,
      dislikesCount: dislikes.length,
      hasLiked,
      hasDisliked,
      isGroupOwner,
    });
  } catch (error) {
    console.error("Error fetching group post:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const createGroupPostComment = async (req, res) => {
  const { groupId, postId } = req.params;
  const { content } = req.body;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }
  if (!content) {
    return res.status(400).json({ message: "Content is required" });
  }

  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const newComment = new GroupPostComment({
      groupPostId: post._id,
      userId,
      content: content.trim(),
    });

    await newComment.save();

    if (post.userId.toString() !== userId.toString()) {
      const notification = new Notification({
        userId: post.userId,
        type: "GROUP_ACTIVITY",
        message: `Your post "${post.title}" has a new comment!`,
      });
      await notification.save();
    }

    const updatedComments = await GroupPostComment.find({ groupPostId: post._id })
      .populate("userId", "username")
      .lean();

    res.status(201).json({ message: "Comment added successfully", comment: newComment, comments: updatedComments });
  } catch (error) {
    console.error("Error creating comment:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const deleteGroupPostComment = async (req, res) => {
  const { groupId, postId, commentId } = req.params;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId) || !objectIdRegex.test(commentId)) {
    return res.status(400).json({ message: "Invalid groupId, postId, or commentId format" });
  }

  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await GroupPostComment.findOne({ _id: commentId, groupPostId: post._id });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isCommentAuthor = comment.userId.toString() === userId.toString();
    const isPostOwner = post.userId.toString() === userId.toString();

    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({ message: "You are not authorized to delete this comment" });
    }

    await GroupPostComment.deleteOne({ _id: commentId });

    if (isCommentAuthor && !isPostOwner) {
      const notification = new Notification({
        userId: post.userId,
        type: "GROUP_ACTIVITY",
        message: `A comment on your post "${post.title}" has been deleted by its author.`,
      });
      await notification.save();
    }

    if (isPostOwner && !isCommentAuthor) {
      const notification = new Notification({
        userId: comment.userId,
        type: "GROUP_ACTIVITY",
        message: `Your comment on the post "${post.title}" has been deleted by the post owner.`,
      });
      await notification.save();
    }

    const updatedComments = await GroupPostComment.find({ groupPostId: post._id })
      .populate("userId", "username")
      .lean();

    res.status(200).json({
      message: "Comment deleted successfully",
      commentId,
      comments: updatedComments,
    });
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const editGroupPostComment = async (req, res) => {
  const { groupId, postId, commentId } = req.params;
  const { content } = req.body;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId) || !objectIdRegex.test(commentId)) {
    return res.status(400).json({ message: "Invalid groupId, postId, or commentId format" });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Content is required and cannot be empty" });
  }

  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await GroupPostComment.findOne({ _id: commentId, groupPostId: post._id });
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this comment" });
    }

    comment.content = content.trim();
    comment.updatedAt = new Date();
    await comment.save();

    if (post.userId.toString() !== userId.toString()) {
      const notification = new Notification({
        userId: post.userId,
        type: "GROUP_ACTIVITY",
        message: `A comment on your post "${post.title}" has been edited by its author.`,
      });
      await notification.save();
    }

    const updatedComments = await GroupPostComment.find({ groupPostId: post._id })
      .populate("userId", "username")
      .lean();

    res.status(200).json({
      message: "Comment updated successfully",
      comment,
      comments: updatedComments,
    });
  } catch (error) {
    console.error("Error editing comment:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const createGroupPostLike = async (req, res) => {
  const { groupId, postId } = req.params;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }

  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingLike = await GroupPostLike.findOne({ groupPostId: post._id, userId });
    if (existingLike) {
      return res.status(400).json({ message: "You have already liked this post" });
    }

    const existingDislike = await GroupPostDislike.findOne({ groupPostId: post._id, userId });
    if (existingDislike) {
      await GroupPostDislike.deleteOne({ _id: existingDislike._id });
    }

    const newLike = new GroupPostLike({
      groupPostId: post._id,
      userId,
    });

    await newLike.save();

    if (post.userId.toString() !== userId.toString()) {
      const notification = new Notification({
        userId: post.userId,
        type: "GROUP_ACTIVITY",
        message: `Your post "${post.title}" has received a new like!`,
      });
      await notification.save();
    }

    const updatedLikes = await GroupPostLike.countDocuments({ groupPostId: post._id });
    const updatedDislikes = await GroupPostDislike.countDocuments({ groupPostId: post._id });

    res.status(201).json({
      message: "Like added successfully",
      likesCount: updatedLikes,
      dislikesCount: updatedDislikes,
      hasLiked: true,
      hasDisliked: false,
    });
  } catch (error) {
    console.error("Error creating like:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const removeGroupPostLike = async (req, res) => {
  const { groupId, postId } = req.params;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }

  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingLike = await GroupPostLike.findOne({ groupPostId: post._id, userId });
    if (!existingLike) {
      return res.status(400).json({ message: "You have not liked this post" });
    }

    await GroupPostLike.deleteOne({ _id: existingLike._id });

    const updatedLikes = await GroupPostLike.countDocuments({ groupPostId: post._id });
    const updatedDislikes = await GroupPostDislike.countDocuments({ groupPostId: post._id });

    res.status(200).json({
      message: "Like removed successfully",
      likesCount: updatedLikes,
      dislikesCount: updatedDislikes,
      hasLiked: false,
      hasDisliked: !!(await GroupPostDislike.findOne({ groupPostId: post._id, userId })),
    });
  } catch (error) {
    console.error("Error removing like:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const createGroupPostDislike = async (req, res) => {
  const { groupId, postId } = req.params;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }

  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingDislike = await GroupPostDislike.findOne({ groupPostId: post._id, userId });
    if (existingDislike) {
      return res.status(400).json({ message: "You have already disliked this post" });
    }

    const existingLike = await GroupPostLike.findOne({ groupPostId: post._id, userId });
    if (existingLike) {
      await GroupPostLike.deleteOne({ _id: existingLike._id });
    }

    const newDislike = new GroupPostDislike({
      groupPostId: post._id,
      userId,
    });

    await newDislike.save();

    if (post.userId.toString() !== userId.toString()) {
      const notification = new Notification({
        userId: post.userId,
        type: "GROUP_ACTIVITY",
        message: `Your post "${post.title}" has received a new dislike!`,
      });
      await notification.save();
    }

    const updatedLikes = await GroupPostLike.countDocuments({ groupPostId: post._id });
    const updatedDislikes = await GroupPostDislike.countDocuments({ groupPostId: post._id });

    res.status(201).json({
      message: "Dislike added successfully",
      likesCount: updatedLikes,
      dislikesCount: updatedDislikes,
      hasLiked: false,
      hasDisliked: true,
    });
  } catch (error) {
    console.error("Error creating dislike:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const removeGroupPostDislike = async (req, res) => {
  const { groupId, postId } = req.params;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }

  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId }).lean();
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const existingDislike = await GroupPostDislike.findOne({ groupPostId: post._id, userId });
    if (!existingDislike) {
      return res.status(400).json({ message: "You have not disliked this post" });
    }

    await GroupPostDislike.deleteOne({ _id: existingDislike._id });

    const updatedLikes = await GroupPostLike.countDocuments({ groupPostId: post._id });
    const updatedDislikes = await GroupPostDislike.countDocuments({ groupPostId: post._id });

    res.status(200).json({
      message: "Dislike removed successfully",
      likesCount: updatedLikes,
      dislikesCount: updatedDislikes,
      hasLiked: !!(await GroupPostLike.findOne({ groupPostId: post._id, userId })),
      hasDisliked: false,
    });
  } catch (error) {
    console.error("Error removing dislike:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const deleteGroupPost = async (req, res) => {
  const { groupId, postId } = req.params;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }

  try {
    const userId = req.user.id;

    const post = await GroupPost.findOne({ groupId, _id: postId });
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const group = await Group.findById(groupId).select("createdBy name").lean();
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isPostAuthor = post.userId.toString() === userId.toString();
    const isGroupOwner = group.createdBy.toString() === userId.toString();

    if (!isPostAuthor && !isGroupOwner) {
      return res.status(403).json({ message: "You are not authorized to delete this post" });
    }

    await GroupPost.deleteOne({ _id: postId });
    await GroupPostComment.deleteMany({ groupPostId: postId });
    await GroupPostLike.deleteMany({ groupPostId: postId });
    await GroupPostDislike.deleteMany({ groupPostId: postId });

    if (isPostAuthor && !isGroupOwner) {
      const groupOwnerNotification = new Notification({
        userId: group.createdBy,
        type: "GROUP_ACTIVITY",
        message: `A post titled "${post.title}" in your group "${group.name}" has been deleted by its author.`,
      });
      await groupOwnerNotification.save();

      const authorNotification = new Notification({
        userId,
        type: "GROUP_ACTIVITY",
        message: `Your post "${post.title}" has been successfully deleted.`,
      });
      await authorNotification.save();
    } else if (isGroupOwner && !isPostAuthor) {
      const postAuthorNotification = new Notification({
        userId: post.userId,
        type: "GROUP_ACTIVITY",
        message: `Your post "${post.title}" in group "${group.name}" has been deleted by the group owner.`,
      });
      await postAuthorNotification.save();

      const ownerNotification = new Notification({
        userId,
        type: "GROUP_ACTIVITY",
        message: `You have deleted the post "${post.title}" from your group "${group.name}".`,
      });
      await ownerNotification.save();
    } else if (isPostAuthor && isGroupOwner) {
      const notification = new Notification({
        userId,
        type: "GROUP_ACTIVITY",
        message: `You have deleted your post "${post.title}" from your group "${group.name}".`,
      });
      await notification.save();
    }

    res.status(200).json({ message: "Post deleted successfully", postId });
  } catch (error) {
    console.error("Error deleting post:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const requestToJoinGroup = async (req, res) => {
  const { groupId } = req.params;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ message: "You are the group owner and already a member" });
    }

    const existingMember = await GroupMember.findOne({ groupId, userId });
    if (existingMember) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }

    if (group.privacy === "public") {
      return res.status(400).json({ message: "This is a public group; use /join instead" });
    }

    const existingRequest = await GroupRequest.findOne({ groupId, userId });
    if (existingRequest) {
      return res.status(400).json({ message: `Request already ${existingRequest.status}` });
    }

    const newRequest = new GroupRequest({ groupId, userId });
    await newRequest.save();

    const requestingUser = await User.findById(userId).select("username").lean();
    const username = requestingUser ? requestingUser.username : "Unknown User";

    const notification = new Notification({
      userId: group.createdBy,
      type: "GROUP_REQUEST",
      message: `${username} has requested to join your group "${group.name}"`,
      metadata: { groupId, requestId: newRequest._id },
    });
    await notification.save();

    return res.status(201).json({ message: "Request sent successfully", requestId: newRequest._id });
  } catch (error) {
    console.error("Error in request process:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const leaveGroup = async (req, res) => {
  const { groupId } = req.params;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() === userId.toString()) {
      return res.status(403).json({ message: "Group owners cannot leave their own group; delete it instead" });
    }

    const existingMember = await GroupMember.findOne({ groupId, userId });
    if (!existingMember) {
      return res.status(400).json({ message: "You are not a member of this group" });
    }

    await GroupMember.deleteOne({ groupId, userId });

    group.memberCount = Math.max((group.memberCount || 0) - 1, 0);
    await group.save();

    await GroupRequest.deleteOne({ groupId, userId });

    const leavingUser = await User.findById(userId).select("username").lean();
    const username = leavingUser ? leavingUser.username : "Unknown User";

    const notification = new Notification({
      userId: group.createdBy,
      type: "GROUP_ACTIVITY",
      message: `${username} has left your group "${group.name}"`,
    });
    await notification.save();

    return res.status(200).json({
      message: "Successfully left the group",
      group: {
        ...group.toObject(),
        memberCount: group.memberCount,
      },
    });
  } catch (error) {
    console.error("Error leaving group:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const joinGroup = async (req, res) => {
  const { groupId } = req.params;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ message: "You are the group owner and already a member" });
    }

    const existingMember = await GroupMember.findOne({ groupId, userId });
    if (existingMember) {
      return res.status(400).json({ message: "You are already a member of this group" });
    }

    if (group.privacy === "private") {
      return res.status(403).json({ message: "This is a private group; please request to join" });
    }

    const newMember = new GroupMember({ groupId, userId });
    await newMember.save();

    group.memberCount = (group.memberCount || 0) + 1;
    await group.save();

    const joiningUser = await User.findById(userId).select("username").lean();
    const username = joiningUser ? joiningUser.username : "Unknown User";

    const notification = new Notification({
      userId: group.createdBy,
      type: "GROUP_ACTIVITY",
      message: `${username} has joined your group "${group.name}"`,
    });
    await notification.save();

    return res.status(200).json({
      message: "Successfully joined the group",
      group: {
        ...group.toObject(),
        memberCount: group.memberCount,
      },
    });
  } catch (error) {
    console.error("Error joining group:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getGroupRequests = async (req, res) => {
  const { groupId } = req.params;
  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId).lean();
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not the group owner" });
    }

    const requests = await GroupRequest.find({ groupId, status: "pending" })
      .populate("userId", "username")
      .lean();
    res.status(200).json(requests);
  } catch (error) {
    console.error("Error fetching group requests:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const acceptGroupRequest = async (req, res) => {
  const { groupId, requestId } = req.params;
  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(requestId)) {
    return res.status(400).json({ message: "Invalid groupId or requestId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not the group owner" });
    }

    const request = await GroupRequest.findById(requestId);
    if (!request || request.groupId.toString() !== groupId) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    request.status = "accepted";
    await request.save();

    const newMember = new GroupMember({ groupId, userId: request.userId });
    await newMember.save();

    group.memberCount = (group.memberCount || 0) + 1;
    await group.save();

    const userNotification = new Notification({
      userId: request.userId,
      type: "GROUP_ACTIVITY",
      message: `You’ve been accepted into the group "${group.name}"!`,
      metadata: { groupId },
    });
    await userNotification.save();

    res.status(200).json({
      message: "Request accepted",
      userId: request.userId,
      memberCount: group.memberCount,
    });
  } catch (error) {
    console.error("Error accepting group request:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const rejectGroupRequest = async (req, res) => {
  const { groupId, requestId } = req.params;
  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(requestId)) {
    return res.status(400).json({ message: "Invalid groupId or requestId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not the group owner" });
    }

    const request = await GroupRequest.findById(requestId);
    if (!request || request.groupId.toString() !== groupId) {
      return res.status(404).json({ message: "Request not found" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    request.status = "rejected";
    await request.save();

    const userNotification = new Notification({
      userId: request.userId,
      type: "GROUP_ACTIVITY",
      message: `Your request to join "${group.name}" was rejected.`,
      metadata: { groupId },
    });
    await userNotification.save();

    res.status(200).json({ message: "Request rejected" });
  } catch (error) {
    console.error("Error rejecting group request:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const reportGroup = async (req, res) => {
  const { groupId } = req.params;
  const { reason, details } = req.body;
  const userId = req.user.id;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    if (group.createdBy.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot report your own group" });
    }

    if (group.reports.some((r) => r.userId.toString() === userId.toString())) {
      return res.status(400).json({ message: "You have already reported this group" });
    }

    group.reports.push({ userId, reason, details });
    await group.save();

    res.status(201).json({ message: "Group reported successfully" });
  } catch (error) {
    console.error("Error reporting group:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const reportPost = async (req, res) => {
  const { groupId, postId } = req.params;
  const { reason, details } = req.body;
  const userId = req.user.id;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(postId)) {
    return res.status(400).json({ message: "Invalid groupId or postId format" });
  }

  try {
    const post = await GroupPost.findOne({ _id: postId, groupId });
    if (!post) return res.status(404).json({ message: "Post not found" });

    if (post.userId.toString() === userId.toString()) {
      return res.status(400).json({ message: "You cannot report your own post" });
    }

    if (post.reports.some((r) => r.userId.toString() === userId.toString())) {
      return res.status(400).json({ message: "You have already reported this post" });
    }

    post.reports.push({ userId, reason, details });
    await post.save();

    res.status(201).json({ message: "Post reported successfully" });
  } catch (error) {
    console.error("Error reporting post:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const editGroup = async (req, res) => {
  const { groupId } = req.params;
  const { name, description, privacy, skillId } = req.body;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }
  if (!name || !description || !privacy) {
    return res.status(400).json({ message: "Name, description, and privacy are required" });
  }
  if (!["public", "private"].includes(privacy)) {
    return res.status(400).json({ message: "Privacy must be 'public' or 'private'" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this group" });
    }

    group.name = name.trim();
    group.description = description.trim();
    group.privacy = privacy;
    group.skillId = skillId || null;
    group.updatedAt = new Date();

    await group.save();

    const notification = new Notification({
      userId,
      type: "GROUP_ACTIVITY",
      message: `Your group "${name}" has been updated successfully!`,
    });
    await notification.save();

    res.status(200).json({ message: "Group updated successfully", group });
  } catch (error) {
    console.error("Error editing group:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const getGroupMembers = async (req, res) => {
  const { groupId } = req.params;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId).lean();
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not the group owner" });
    }

    const members = await GroupMember.find({ groupId })
      .populate("userId", "username _id")
      .lean();

    res.status(200).json({
      message: "Group members retrieved successfully",
      members: members.map(member => ({
        userId: member.userId._id,
        username: member.userId.username,
      })),
      memberCount: members.length,
    });
  } catch (error) {
    console.error("Error fetching group members:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const removeGroupMember = async (req, res) => {
  const { groupId, memberId } = req.params;

  if (!objectIdRegex.test(groupId) || !objectIdRegex.test(memberId)) {
    return res.status(400).json({ message: "Invalid groupId or memberId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (group.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({ message: "You are not the group owner" });
    }

    if (group.createdBy.toString() === memberId) {
      return res.status(400).json({ message: "You cannot remove yourself as the group owner" });
    }

    const member = await GroupMember.findOne({ groupId, userId: memberId });
    if (!member) {
      return res.status(404).json({ message: "Member not found in this group" });
    }

    await GroupMember.deleteOne({ groupId, userId: memberId });

    group.memberCount = Math.max((group.memberCount || 0) - 1, 0);
    await group.save();

    const removedUser = await User.findById(memberId).select("username").lean();
    const removedUsername = removedUser ? removedUser.username : "Unknown User";

    const memberNotification = new Notification({
      userId: memberId,
      type: "GROUP_ACTIVITY",
      message: `You have been removed from the group "${group.name}" by the owner.`,
      metadata: { groupId },
    });
    await memberNotification.save();

    const ownerNotification = new Notification({
      userId: group.createdBy,
      type: "GROUP_ACTIVITY",
      message: `You have removed ${removedUsername} from your group "${group.name}".`,
      metadata: { groupId, removedUserId: memberId },
    });
    await ownerNotification.save();

    res.status(200).json({
      message: "Member removed successfully",
      memberId,
      memberCount: group.memberCount,
    });
  } catch (error) {
    console.error("Error removing group member:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const checkMembership = async (req, res) => {
  const { groupId } = req.params;

  if (!objectIdRegex.test(groupId)) {
    return res.status(400).json({ message: "Invalid groupId format" });
  }

  try {
    const userId = req.user.id;
    const group = await Group.findById(groupId).lean();
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = await GroupMember.findOne({ groupId, userId });
    res.status(200).json({ isMember: !!isMember });
  } catch (error) {
    console.error("Error checking membership:", error.message);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
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
};