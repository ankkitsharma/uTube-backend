import { NextFunction, Request, Response } from "express";

export function asyncHandler(requestHandler) {
  return function (req: Request, res: Response, next: NextFunction) {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
    next();
  };
}

// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }
