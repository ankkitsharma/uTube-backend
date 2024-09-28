import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { User } from "../models/user.model";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { ApiResponse } from "../utils/ApiResponse";
import fs from "fs";
import jwt from "jsonwebtoken";

async function generateAccessAndRefreshTokens(userId) {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
}

export const registerUser = asyncHandler(async function (req, res) {
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;
  try {
    // get user details from frontend
    const { fullName, email, username, password } = req.body;
    console.log(req.body);

    // check for images, check for avatar

    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is required");
    }

    // validation - not empty
    if (
      [fullName, email, username, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      throw new ApiError(400, "All fields are required");
    }

    // check if user already exists
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "User with email or username already Exists");
    }

    console.log(req.files);

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverLocalPath);

    if (!avatar) {
      throw new ApiError(400, "Avatar file is required");
    }

    // create user object - create entry in db
    // remove password and refresh token field from response
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    // check for user creation
    if (!createdUser) {
      throw new ApiError(
        500,
        "Something went wrong while registering the user"
      );
    }

    // return response
    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered Successfully"));
  } finally {
    avatarLocalPath && fs.unlinkSync(avatarLocalPath);
    coverLocalPath && fs.unlinkSync(coverLocalPath);
  }
});

export const loginUser = asyncHandler(async function (req, res) {
  // get user details from req body
  const { username, email, password } = req.body;

  // check if username or email
  if (!username && !email) {
    throw new ApiError(400, "username or email is required");
  }

  // find the user
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }

  // compare password with saved password using bcrypt
  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "'Invalid user credentials");
  }

  // generate access and refreshtoken
  // save refreshtoken in db
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // return res.status along with tokens
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged In Successfully"
      )
    );
});

export const logoutUser = asyncHandler(async function (req, res) {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

export const refreshAccessToken = asyncHandler(async function (req, res, next) {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );

  if (typeof decodedToken === "object" && "_id" in decodedToken) {
    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh Token");
    }

    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed"
        )
      );
  } else {
    throw new ApiError(401, "Invalid refresh token");
  }
});

export const changeCurrentPassword = asyncHandler(async function (req, res) {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async function (req, res) {
  return res
    .status(200)
    .json(200, req.user, "current user fetched successfully");
});

export const updateAccountDetails = asyncHandler(async function (req, res) {
  const { fullName, email } = req.body;

  if (!fullName || !email) {
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?.id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async function (req, res) {
  const avatarLocalPath = req.file?.path;
  try {
    if (!avatarLocalPath) {
      throw new ApiError(400, "Avatar file is missing");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
      throw new ApiError(400, "Error while uploading on avatar");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          avatar: avatar.url,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");

    res
      .status(200)
      .json(new ApiResponse(200, user, "Avatar image updated successfully"));
  } finally {
    fs.unlinkSync(avatarLocalPath);
  }
});

const updateUserCoverImage = asyncHandler(async function (req, res) {
  const coverImageLocalPath = req.file?.path;
  try {
    if (!coverImageLocalPath) {
      throw new ApiError(400, "Cover image file is missing");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage.url) {
      throw new ApiError(400, "Error while uploading on cover image");
    }

    const user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          coverImage: coverImage.url,
        },
      },
      {
        new: true,
      }
    ).select("-password -refreshToken");
    res
      .status(200)
      .json(new ApiResponse(200, user, "Cover image updated successfully"));
  } finally {
    fs.unlinkSync(coverImageLocalPath);
  }
});
