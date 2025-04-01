import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Channel ID is required");
  }

  const userId = req.user._id;

  const existingSubscription = await Subscription.findOne({
    subscriber: userId,
    channel: channelId,
  });

  if (existingSubscription) {
    // Unsubscribe (Remove Subscription)
    await Subscription.deleteOne({ _id: existingSubscription._id });

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Unsubscribed successfully"));
  }

  // Subscribe (Add Subscription)
  const newSubscription = await Subscription.create({
    subscriber: userId,
    channel: channelId,
  });

  return res
    .status(201)
    .json(new ApiResponse(201, newSubscription, "Subscribed successfully"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID format");
  }

  const subscribers = await Subscription.aggregate([
    {
      $match: { channel: new mongoose.Types.ObjectId(subscriberId) },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscriberDetails",
      },
    },
    {
      $unwind: "$subscriberDetails",
    },
    {
      $project: {
        _id: 0,
        subscriberId: "$subscriberDetails._id",
        name: "$subscriberDetails.username",
        email: "$subscriberDetails.email",
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscribers,
        "Fetched channel subscribers successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
});

export { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription };
