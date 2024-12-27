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

  const newVideo = await Video.create({
    title,
    description,
    videoFile: uploadedVideo.url,
    thumbnail: uploadedThumbnail.url,
    duration: uploadedVideo.duration,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newVideo, "Video created successfully"));
});

export { publishVideo };
