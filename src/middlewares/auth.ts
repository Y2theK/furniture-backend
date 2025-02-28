import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../config/errorCode";

interface CustomRequest extends Request {
  userId?: number;
}

const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    const error: any = new Error("You are not an authenticated user");
    error.status = 401;
    error.code = errorCode.unauthenticated;
    return next(error);
  }
  if (!accessToken) {
    const error: any = new Error("Access Token has expired");
    error.status = 401;
    error.code = errorCode.accessTokenExpired;
    return next(error);
  }

  // verify jwt access token
  let decoded;
  try {
    decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
      id: number;
    };
    req.userId = decoded.id;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      error.message = "Access Token has expired.";
      error.status = 401;
      error.code = errorCode.accessTokenExpired;
    } else {
      error.message = "Access Token is Invalid.";
      error.status = 400;
      error.code = errorCode.attack;
    }

    return next(error);
  }
};

export default auth;
