import { NextFunction, Request, Response } from "express";
import { getUserById } from "../services/authService";
import { checkUserIfNotExist } from "../util/auth";
import { errorCode } from "../config/errorCode";
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
      const error: any = new Error("This action is not allowed");
      error.status = 400;
      error.code = errorCode.unauthorised;
      return next(error);
    }

    if (!permission && result) {
      const error: any = new Error("This action is not allowed");
      error.status = 400;
      error.code = errorCode.unauthorised;
      return next(error);
    }
    req.user = user;

    next();
  };
};
