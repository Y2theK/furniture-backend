import { NextFunction, Request, Response } from "express";
import { getUserById } from "../services/authService";
import { checkUserIfNotExist } from "../util/auth";
import { errorCode } from "../config/errorCode";
import { createError } from "../util/error";
interface CustomRequest extends Request {
  userId?: number;
  user?: any;
}
export const authorize = (permission: boolean, ...roles: string[]) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.userId;
    const user: any = await getUserById(userId!);
    checkUserIfNotExist(user);

    const result = roles.includes(user.role);

    if (permission && !result) {
      return next(createError("This action is not allowed",400,errorCode.unauthorised));
    }

    if (!permission && result) {
      return next(createError("This action is not allowed",400,errorCode.unauthorised));
    }
    req.user = user;

    next();
  };
};
