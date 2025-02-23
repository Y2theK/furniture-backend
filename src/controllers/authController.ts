import { error } from "console";
import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import {
  createOTP,
  createUser,
  getOtpByPhone,
  getUserByPhone,
  updateOTP,
  updateUser,
} from "../services/authService";
import {
  checkOtpErrorIfSameDate,
  checkOtpRow,
  checkUserExists,
} from "../util/auth";
import { generateOTP, generateToken } from "../util/generate";
import { compare, genSalt, hash } from "bcrypt";
import moment from "moment";
import jwt from "jsonwebtoken";
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
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      return next(error);
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

    const otp = generateOTP();
    const salt = await genSalt(10);
    const hashOtp = await hash(otp.toString(), salt);
    const token = generateToken();

    const otpRow: any = getOtpByPhone(phone);
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
          const error: any = new Error(
            "OTP is allowed to request 3 times per day."
          );
          error.status = 405;
          error.code = "Error_OverLimit";
          return next(error);
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
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      return next(error);
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
      const error: any = new Error("Invalid toke");
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    const isOtpExpire = moment().diff(otpRow.updatedAt, "minutes") > 5; // if expires is more than 5 minute
    if (isOtpExpire) {
      const error: any = new Error("OTP is expired");
      error.status = 400;
      error.code = "Error_Expired";
      return next(error);
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
      const error: any = new Error("OTP is wrong");
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
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
    .matches("^[0-9]+$")
    .isLength({ min: 8, max: 8 }),
  body("token", "Invalid token").trim().notEmpty().escape(),
  async (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      return next(error);
    }

    const { phone, token, password } = req.body;
    const user = getOtpByPhone(phone);
    checkUserExists(user);

    const otpRow: any = getOtpByPhone(phone);
    checkOtpRow(otpRow);

    if (otpRow.error === 5) {
      const error: any = new Error("This attack may be an attack.");
      error.status = 400;
      error.code = "Error_BadRequest";
      return next(error);
    }

    if (!otpRow.verifyToken !== token) {
      await updateOTP(otpRow.id, {
        error: 5,
      });
      const error: any = new Error("Invalid token.");
      error.status = 400;
      error.code = "Error_Invalid";
      return next(error);
    }

    const isOtpExpire = moment().diff(otpRow.updatedAt, "minutes") > 10;
    if (isOtpExpire) {
      const error: any = new Error("Request expired.");
      error.status = 400;
      error.code = "Error_Expired";
      return next(error);
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

    res.status(200).json({
      message: "Successfully created an account",
      userId: newUser.id,
      accessToken,
      refreshToken,
    });
  },
];

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json({ message: "Login" });
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json({ message: "Logout" });
};
