import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const addComment = asyncHandler(async (req, res) => {
  const { content, video, owner } = req.body;

  if ([content, video, owner].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  const newComment = await Comment.create({ content, video, owner });

  return res
    .status(201)
    .json(new ApiResponse(200, newComment, "Comment Added successfully"));
});

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw new ApiError(400, "VideoId is required");
  }

  const comment = await Comment.aggregate([
    {
      $match: { video: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "userDetails",
      },
    },
    {
      $unwind: "$userDetails",
    },
    {
      $project: {
        content: 1,
        video: 1,
        createdAt: 1,
        updatedAt: 1,
        "userDetails._id": 1,
        "userDetails.username": 1,
        "userDetails.email": 1,
        "userDetails.avatar": 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment fetched successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  const { content } = req.body;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format");
  }

  if (!content || content.trim() === "") {
    throw new ApiError(400, "Content is required");
  }

  const updatedComment = await Comment.findOneAndUpdate(
    {
      _id: commentId,
    },
    {
      $set: { content },
    },
    { new: true }
  );

  if (!updatedComment) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!commentId) {
    throw new ApiError(400, "Comment ID is required");
  }

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format");
  }

  const result = await Comment.deleteOne({ _id: commentId });

  if (result.deletedCount === 0) {
    throw new ApiError(404, "Comment not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Comment deleted successfully"));
});

export { addComment, deleteComment, getVideoComments, updateComment };
