import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../config/errorCode";
import { getUserById, updateUser } from "../services/authService";
import { checkUserIfNotExist } from "../util/auth";
import { createError } from "../util/error";

interface CustomRequest extends Request {
  userId?: number;
}

const auth = (req: CustomRequest, res: Response, next: NextFunction) => {
  const accessToken = req.cookies ? req.cookies.accessToken : null;
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    return next(createError("You are not an c authenticated user",401,errorCode.unauthenticated));
  }
  const generateNewToken = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: number;
        phone: string;
      };
    } catch (err) {
      return next(createError("You are not an c authenticated user",401,errorCode.unauthenticated));
    }
    if (isNaN(decoded.id)) {
      return next(createError("You are not an c authenticated user",401,errorCode.unauthenticated));
    }
    const user: any = await getUserById(decoded.id);
    checkUserIfNotExist(user);

    if (user.phone !== decoded.phone) {
      return next(createError("You are not an c authenticated user",401,errorCode.unauthenticated));
    }

    if (user.randToken !== refreshToken) {
      return next(createError("You are not an c authenticated user",401,errorCode.unauthenticated));

    }

    // jwt token
    const accessPayload = {
      id: user.id,
    };
    const refreshPayload = {
      id: user.id,
      phone: user.phone,
    };
    const newAccessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 min
      }
    );
    const newRefreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d", // 30 days
      }
    );

    await updateUser(user.id, {
      randToken: newRefreshToken,
      errorLoginCount: 0, // reset error count
    });

    // to tell browser to store as https-only cookies
    res
      .cookie("accessToken", newAccessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15 min
      })
      .cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

    req.userId = decoded.id;
    next();
  };
  if (!accessToken) {
    generateNewToken();
  } else {
    // verify jwt access token
    let decoded;
    try {
      decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET!) as {
        id: number;
      };
      if (isNaN(decoded.id)) {
        return next(createError("You are not an c authenticated user",401,errorCode.unauthenticated));
      }
      req.userId = decoded.id;
      next();
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        generateNewToken();
      } else {
        return next(createError(error.message,400,errorCode.attack));       
      }
    }
  }
};

export default auth;
