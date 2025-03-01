import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { errorCode } from "../config/errorCode";
import { getUserById, updateUser } from "../services/authService";
import { checkUserIfNotExist } from "../util/auth";

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
  const generateNewToken = async () => {
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!) as {
        id: number;
        phone: string;
      };
    } catch (err) {
      const error: any = new Error("You are not an authenticated user");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }
    const user: any = await getUserById(decoded.id);
    checkUserIfNotExist(user);

    if (user.phone !== decoded.phone) {
      const error: any = new Error("You are not an authenticated user");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
    }

    if (user.randToken !== refreshToken) {
      const error: any = new Error("You are not an authenticated user");
      error.status = 401;
      error.code = errorCode.unauthenticated;
      return next(error);
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
        expiresIn: 60 * 2, // 15 min
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
        maxAge: 2 * 60 * 1000, // 15 min
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
    // const error: any = new Error("Access Token has expired");
    // error.status = 401;
    // error.code = errorCode.accessTokenExpired;
    // return next(error);
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
      generateNewToken();
      // error.message = "Access Token has expired.";
      // error.status = 401;
      // error.code = errorCode.accessTokenExpired;
    } else {
      error.message = "Access Token is Invalid.";
      error.status = 400;
      error.code = errorCode.attack;
    }

    return next(error);
  }
};

export default auth;
