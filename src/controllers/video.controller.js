import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import uploadOnCloudinary from "../utils/cloudinary.js";

const publishVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  const videoFilePath = req.files?.videoFile?.[0]?.path;
  const thumbnailFilePath = req.files?.thumbnail?.[0]?.path;

  if (!videoFilePath) {
    throw new ApiError(400, "Video file is required");
  }

  if (!thumbnailFilePath) {
    throw new ApiError(400, "Thumbnail file is required");
  }

  const uploadedVideo = await uploadOnCloudinary(videoFilePath);
  if (!uploadedVideo) {
    throw new ApiError(500, "Failed to upload video file");
  }

  const uploadedThumbnail = await uploadOnCloudinary(thumbnailFilePath);
  if (!uploadedThumbnail) {
    throw new ApiError(500, "Failed to upload thumbnail file");
  }

  const userId = req.user?._conditions?._id;

  const newVideo = await Video.create({
    title,
    description,
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail.url,
    duration: uploadedVideo.duration,
    owner: userId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video created successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

  const pageNumber = parseInt(page);
  const limitNumber = parseInt(limit);

  const skip = (pageNumber - 1) * limitNumber;

  const filter = {};
  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }
  if (userId) {
    filter.owner = userId;
  }

  const sort = {};
  if (sortBy && sortType) {
    sort[sortBy] = sortType === "desc" ? -1 : 1;
  } else {
    sort.createdAt = -1;
  }

  const videos = await Video.aggregate([
    {
      $match: filter,
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: { path: "$ownerDetails", preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        title: 1,
        videoFile: 1,
        thumbnail: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        updatedAt: 1,
        "ownerDetails._id": 1,
        "ownerDetails.username": 1,
        "ownerDetails.email": 1,
        "ownerDetails.avatar": 1,
      },
    },
    { $sort: sort },
    { $skip: skip },
    { $limit: limitNumber },
  ]);

  const totalVideos = await Video.countDocuments(filter);

  const totalPages = Math.ceil(totalVideos / limitNumber);

  if (!videos.length) {
    throw new ApiError(404, "No videos found");
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        pagination: {
          currentPage: pageNumber,
          totalPages: totalPages,
          totalVideos: totalVideos,
          limit: limitNumber,
        },
      },
      "Videos fetched successfully"
    )
  );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!videoId) {
    throw ApiError(400, "Invalid video ID format");
  }

  const videoById = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: "$ownerDetails",
    },
    {
      $project: {
        title: 1,
        videoFile: 1,
        thumbnail: 1,
        description: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
        updatedAt: 1,
        "ownerDetails._id": 1,
        "ownerDetails.username": 1,
        "ownerDetails.email": 1,
        "ownerDetails.avatar": 1,
      },
    },
  ]);

  if (!videoById.length) {
    throw ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoById[0], "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) {
    throw ApiError(400, "Invalid video ID format");
  }

  const { title, description } = req.body;
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  const localFilePath = req.file?.path;
  if (!localFilePath) {
    throw new ApiError(400, "thumbnail is missing");
  }

  const thumbnail = await uploadOnCloudinary(localFilePath);
  if (!thumbnail?.url) {
    throw new ApiError(400, "Error while uploading the image");
  }

  const updatedVideo = await Video.findOneAndUpdate(
    { _id: videoId },
    { $set: { title, description, thumbnail: thumbnail.url } },
    { new: true }
  ).populate("owner", "username email avatar");

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

export { getAllVideos, getVideoById, publishVideo, updateVideo };
