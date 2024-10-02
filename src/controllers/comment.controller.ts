import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import { asyncHandler } from "../utils/asyncHandler";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  const pipeline = [
    {
      $match: {
        video: new mongoose.Types.ObjectId(`${videoId}`),
      },
    },
  ];

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customlabels: {
      totalDocs: "totalComments",
      docs: "comments",
    },
  };

  try {
    const result = await Comment.aggregatePaginate(
      Comment.aggregate(pipeline),
      options
    );

    if (Array.isArray(result.comments) && result.comments.length === 0) {
      return res
        .status(404)
        .json(new ApiResponse(404, {}, "No comments found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, result, "Comments fetched successfully"));
  } catch (error) {
    res
      .status(500)
      .json(
        new ApiResponse(500, {}, "Error in Comments aggregation pagination")
      );
  }
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  const { content } = req.body;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid videoId");
  }

  if (!content) {
    res
      .status(400)
      .json(new ApiResponse(400, {}, "Please enter valid comment"));
  }

  const comment = await Comment.create({
    content: content,
    video: videoId,
    owner: req.user?._id,
  });

  if (!comment) {
    throw new ApiError(500, "Comment not saved to Db");
  }

  res
    .status(200)
    .json(new ApiResponse(200, comment, "comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
