import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

interface CustomRequest extends Request {
  user: any;
}

export const verifyJWT = asyncHandler(async function (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request");
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  if (typeof decodedToken === "object" && "_id" in decodedToken) {
    const user = await User.findById(decodedToken._id).select(
      "-password, -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
  } else {
    throw new ApiError(401, "Invalid token");
  }

  next();
});
