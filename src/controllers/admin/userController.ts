import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface CustomRequest extends Request {
  userId?: number;
}

export const getAllUser = (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const id = req.userId;
  res.status(200).json({
    currentUser: id,
    message: req.t("welcome"),
  });
};
