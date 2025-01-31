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
  const videos = await Video.aggregate([
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
    { $sort: { createdAt: -1 } },
  ]);

  if (!videos.length) {
    throw new ApiError(404, "No videos found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

export { getAllVideos, publishVideo };
