import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { createError } from "../../util/error";
import { errorCode } from "../../config/errorCode";
import { createOrUpdateSetting } from "../../services/settingService";

interface CustomRequest extends Request {
  userId?: number;
}

export const setMaintainance = [
  body("mode", "Mode must be boolean").isBoolean(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { mode } = req.body;

    const value = mode ? "true" : "false";
    const message = mode
      ? "Successfully set maintainance mode"
      : "Successfully turn off maintainance mode";

    await createOrUpdateSetting("maintainance", value);

    res.status(200).json({
      message: message,
    });
  },
];
