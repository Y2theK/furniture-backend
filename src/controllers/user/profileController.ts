import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { createError } from "../../util/error";

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
      return next(createError(errors[0].msg,400,errorCode.invalid));
    }

    const { lng } = req.query;

    res.cookie("i18next", "lng");
    res.status(200).json({
      message: req.t("changeLang", { lang: lng }),
    });
  },
];
