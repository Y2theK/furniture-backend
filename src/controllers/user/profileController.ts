import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";

interface CustomRequest extends Request {
  userId?: number;
}

export const changeLanguage = [
  query("lng", "Invalid Language Code")
    .trim()
    .notEmpty()
    .matches("^[a-z]+$")
    .isLength({ min: 2, max: 3 }),
  (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      const error: any = new Error(errors[0].msg);
      error.status = 400;
      error.code = errorCode.invalid;
      return next(error);
    }

    const { lng } = req.query;

    res.cookie("i18next", "lng");
    res.status(200).json({
      message: req.t("changeLang", { lang: lng }),
    });
  },
];
