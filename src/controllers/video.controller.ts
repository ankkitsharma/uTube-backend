import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { deleteFromCloudinary } from "../utils/cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = 1,
    userId = "",
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  let filter = {
    $and: [
      {
        $or: [
          {
            title: {
              $regex: query,
              $options: "i",
            },
          },
          {
            description: {
              $regex: query,
              $options: "i",
            },
          },
        ],
      },
      {
        $or: [
          {
            owner: new mongoose.Types.ObjectId(`${userId}`),
          },
        ],
      },
    ],
  };

  let pipeline = [
    {
      $match: filter,
    },
    {
      $sort: {
        [sortBy]: sortType, // sortType: 1 means ascending order and -1 means descending order
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              _id: 1,
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customlabels: {
      totalDocs: "totalVideos",
      docs: "videos",
    },
  };

  try {
    const result = await Video.aggregatePaginate(
      Video.aggregate(pipeline),
      options
    );

    if (Array.isArray(result.videos) && result.videos.length === 0) {
      return res.status(404).json(new ApiResponse(404, {}, "No videos found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, result, "Videos fetched successfully"));
  } catch (error) {
    res
      .status(500)
      .json(new ApiResponse(500, {}, "Error in video aggegation pagination"));
  }
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;
  const videoFileCloudinary = await uploadOnCloudinary(
    videoFileLocalPath,
    "video"
  );
  const thumbnailCloudinary = await uploadOnCloudinary(
    thumbnailLocalPath,
    "image"
  );

  if (!videoFileCloudinary) {
    throw new ApiError(400, "video Uploading failed");
  }
  if (!thumbnailCloudinary) {
    throw new ApiError(400, "thumbnail Uploading failed");
  }

  const video = await Video.create({
    title,
    description,
    videoFile: videoFileCloudinary?.url,
    thumbnail: thumbnailCloudinary?.url,
    duration: videoFileCloudinary?.duration,
    isPublished: true,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(500, "Something went wrong while publishing video");
  }

  return res.status(201).json(new ApiResponse(200, video, "Video published"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const { title, description } = req.body;

  const video = await Video.findByIdAndUpdate(videoId);
  if (!video) {
    throw new ApiError(400, "Could not find video for this id");
  }

  const oldThumbnailCloudinary = video?.thumbnail;

  const deletedThumbnail = await deleteFromCloudinary(
    oldThumbnailCloudinary,
    "image"
  );

  if (!deletedThumbnail) {
    throw new ApiError(400, "thumbnail not deleted");
  }

  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  const thumbnailCloudinary = await uploadOnCloudinary(
    thumbnailLocalPath,
    "image"
  );

  if (!thumbnailCloudinary) {
    throw new ApiError(400, "thumbnail Uploading failed");
  }

  video.title = title;
  video.description = description;
  video.thumbnail = thumbnailCloudinary.url;

  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated Successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "No matches found for this videoId");
  }

  if (!video.Owner.equals(req.user._id)) {
    throw new ApiError(403, "You are not authorized to delete this video");
  }

  const videoFile = await deleteFromCloudinary(video.videoFile, "video");
  const thumbnail = await deleteFromCloudinary(video.thumbnail, "img");

  if (!videoFile && !thumbnail) {
    throw new ApiError(
      400,
      "thumbnail or videoFile is not deleted from cloudinary"
    );
  }

  await video.remove();

  res.status(200).json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }

  // const video = await Video.findByIdAndUpdate(videoId);

  const video = await Video.findOne({
    _id: videoId,
    Owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(400, "Invalid Video or owner");
  }

  video.isPublished = !video.isPublished;

  await video.save();

  res
    .status(200)
    .json(new ApiResponse(200, video.isPublished, "Video is unpublished"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
