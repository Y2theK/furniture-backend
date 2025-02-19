import { error } from "console";
import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
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
      // return res.status(400).json({ errors: errors.array() });

      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = "VALIDATION_ERROR";
      return next(error);
    }

    res.json({ message: "Register" });
  },
];

export const verifyOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json({ message: "Verift OTP" });
};

export const confirmPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json({ message: "Confirm Password" });
};

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
