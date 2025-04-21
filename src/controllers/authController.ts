import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import {
  createOTP,
  createUser,
  getOtpByPhone,
  getUserById,
  getUserByPhone,
  updateOTP,
  updateUser,
} from "../services/authService";
import {
  checkOtpErrorIfSameDate,
  checkOtpRow,
  checkUserExists,
  checkUserIfNotExist,
} from "../util/auth";
import { generateOTP, generateToken } from "../util/generate";
import { compare, genSalt, hash } from "bcrypt";
import moment from "moment";
import jwt from "jsonwebtoken";
import { errorCode } from "../config/errorCode";
import { createError } from "../util/error";

interface CustomRequest extends Request {
  userId?: number;
}
export const register = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 })
    .withMessage("Phone number must be between 5 and 10 digits"),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    let phone = req.body.phone;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }

    const user = await getUserByPhone(phone);
    checkUserExists(user);

    // generate OTP and call OTP sending service
    // if sms OTP cannot be sent, return error
    // save OTP to database - with hash and expirty time

    // const otp = generateOTP();
    const otp = "123123";
    const salt = await genSalt(10);
    const hashOtp = await hash(otp.toString(), salt);
    // const hashOtp = "123123";
    const token = generateToken();

    const otpRow: any = await getOtpByPhone(phone);
    let result;

    if (!otpRow) {
      const otpData = {
        phone,
        otp: hashOtp,
        rememberToken: token,
        count: 1,
      };

      result = await createOTP(otpData);
    } else {
      const lastOtpRequest = new Date(otpRow.updatedAt).toLocaleDateString();
      const today = new Date().toLocaleDateString();
      const isSameDate = today === lastOtpRequest;
      checkOtpErrorIfSameDate(isSameDate, otpRow.error);
      if (!isSameDate) {
        const otpData = {
          phone,
          otp: hashOtp,
          rememberToken: token,
          count: 1,
          error: 0,
        };
        result = await updateOTP(otpRow.id, otpData);
      } else {
        if (otpRow.count === 3) {
          return next(
            createError(
              "OTP is allowed to request 3 times per day.",
              405,
              errorCode.overLimit
            )
          );
        }

        const otpData = {
          phone,
          otp: hashOtp,
          rememberToken: token,
          count: {
            increment: 1, // increse 1 to current count
          },
          error: 0,
        };
        result = await updateOTP(otpRow.id, otpData);
      }
    }

    res.status(200).json({
      message: `We have sent OTP to ${result.phone}`,
      phone: result.phone,
      token: result.rememberToken,
    });
  },
];

export const verifyOtp = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 })
    .withMessage("Phone number must be between 5 and 10 digits"),
  body("otp", "Invalid OTP").trim().notEmpty().isLength({ min: 6, max: 6 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { phone, otp, token } = req.body;
    const user = await getUserByPhone(phone);
    checkUserExists(user);

    const otpRow: any = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    // if same date and over limit
    const lastOtpVerified = new Date(otpRow.updatedAt).toLocaleDateString();
    const today = new Date().toLocaleDateString();
    const isSameDate = today === lastOtpVerified;
    checkOtpErrorIfSameDate(isSameDate, otpRow.error);

    if (otpRow.rememberToken !== token) {
      await updateOTP(otpRow.id, {
        count: 5,
      });
      return next(createError("Invalid token", 400, errorCode.invalid));
    }

    const isOtpExpire = moment().diff(otpRow.updatedAt, "minutes") > 5; // if expires is more than 5 minute
    if (isOtpExpire) {
      return next(createError("OTP is expired", 400, errorCode.invalid));
    }

    const isMatchOpt = await compare(otp, otpRow.otp);
    if (!isMatchOpt) {
      if (!isSameDate) {
        await updateOTP(otpRow.id, {
          error: 1,
        });
      } else {
        await updateOTP(otpRow.id, {
          error: {
            increment: 1,
          },
        });
      }
      return next(createError("OTP is wrong", 400, errorCode.invalid));
    }

    const verifyToken = generateToken();
    const result = await updateOTP(otpRow.id, {
      verifyToken: verifyToken,
    });

    res.status(200).json({
      message: "OTP is successfully verified.",
      phone: result.phone,
      token: result.verifyToken,
    });
  },
];

export const confirmPassword = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 })
    .withMessage("Phone number must be between 5 and 10 digits"),
  body("password", "Invalid Password")
    .trim()
    .notEmpty()
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { phone, token, password } = req.body;
    const user = await getUserByPhone(phone);

    checkUserExists(user);

    const otpRow: any = await getOtpByPhone(phone);
    checkOtpRow(otpRow);

    if (otpRow.error === 5) {
      return next(
        createError("This attack may be an attack.", 400, errorCode.attack)
      );
    }

    if (otpRow.verifyToken !== token) {
      await updateOTP(otpRow.id, {
        error: 5,
      });
      return next(createError("Invalid token.", 400, errorCode.invalid));
    }

    const isOtpExpire = moment().diff(otpRow.updatedAt, "minutes") > 10;
    if (isOtpExpire) {
      return next(
        createError("Request expired.", 400, errorCode.requestExpired)
      );
    }

    const salt = await genSalt(10);
    const hashPassword = await hash(password, salt);
    const randToken = generateToken();

    const newUser = await createUser({
      phone,
      password: hashPassword,
      randToken,
    });

    // jwt token
    const accessPayload = {
      id: newUser.id,
    };
    const refreshPayload = {
      id: newUser.id,
      phone: newUser.phone,
    };
    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15,
      }
    );
    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    await updateUser(newUser.id, {
      randToken: refreshToken,
    });

    // to tell browser to store as https-only cookies
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000,
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      })
      .status(201)
      .json({
        message: "Successfully created an account",
        userId: newUser.id,
      });
  },
];

export const login = [
  body("phone", "Invalid phone number")
    .trim()
    .notEmpty()
    .matches("^[0-9]+$")
    .isLength({ min: 5, max: 12 })
    .withMessage("Phone number must be between 5 and 10 digits"),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    let phone = req.body.phone;
    const password = req.body.password;
    if (phone.slice(0, 2) === "09") {
      phone = phone.substring(2, phone.length);
    }

    const user: any = await getUserByPhone(phone);
    checkUserIfNotExist(user);

    // if user status is freeze
    if (user.status === "FREEZE") {
      return next(
        createError(
          "Your accound is temporary lock. Please contact us.",
          400,
          errorCode.accountFreeze
        )
      );
    }
    const isMatchPassword = await compare(password, user.password);

    // if password match
    if (!isMatchPassword) {
      const lastRequest = new Date(user.updatedAt).toLocaleDateString();
      const isSameDate = lastRequest === new Date().toLocaleDateString();

      if (!isSameDate) {
        await updateUser(user.id, {
          errorLoginCount: 1,
        });
      } else {
        let userData;
        if (user.errorLoginCount >= 2) {
          userData = {
            status: "FREEZE",
          };
        } else {
          userData = {
            errorLoginCount: {
              increment: 1,
            },
          };
        }
        await updateUser(user.id, userData);
      }

      return next(createError("Invalid Credentials.", 400, errorCode.invalid));
    }

    // jwt token
    const accessPayload = {
      id: user.id,
    };
    const refreshPayload = {
      id: user.id,
      phone: user.phone,
    };
    const accessToken = jwt.sign(
      accessPayload,
      process.env.ACCESS_TOKEN_SECRET!,
      {
        expiresIn: 60 * 15, // 15 min
      }
    );
    const refreshToken = jwt.sign(
      refreshPayload,
      process.env.REFRESH_TOKEN_SECRET!,
      {
        expiresIn: "30d", // 30 days
      }
    );

    await updateUser(user.id, {
      randToken: refreshToken,
      errorLoginCount: 0, // reset error count
    });

    // to tell browser to store as https-only cookies
    res
      .cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 15 * 60 * 1000, // 15 min
        path: "/",
      })
      .cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: "/",
      })
      .status(200)
      .json({
        message: "Successfully login.",
        userId: user.id,
      });
  },
];

export const authCheck = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const user = await getUserById(userId!);
  checkUserIfNotExist(user);

  res.status(200).json({
    message: "You are authenticated user",
    userId: user?.id,
    userName: user?.firstName + " " + user?.lastName,
    image: user?.image,
  });
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const refreshToken = req.cookies ? req.cookies.refreshToken : null;

  if (!refreshToken) {
    return next(
      createError(
        "You are not an c authenticated user",
        401,
        errorCode.unauthenticated
      )
    );
  }

  // verify jwt access token
  let decoded: any;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET!);
  } catch (err: any) {
    return next(
      createError(
        "You are not an c authenticated user",
        401,
        errorCode.unauthenticated
      )
    );
  }

  if (isNaN(decoded.id)) {
    return next(
      createError(
        "You are not an d authenticated user",
        401,
        errorCode.unauthenticated
      )
    );
  }

  const user: any = await getUserById(decoded.id);
  checkUserIfNotExist(user);

  if (user.phone !== decoded.phone) {
    return next(
      createError(
        "You are not an e authenticated user",
        401,
        errorCode.unauthenticated
      )
    );
  }

  await updateUser(user.id, {
    randToken: generateToken(),
  });
  res.clearCookie("refreshToken");
  res.clearCookie("accessToken");
  res.status(200).json({ message: "Logout successfully" });
};
