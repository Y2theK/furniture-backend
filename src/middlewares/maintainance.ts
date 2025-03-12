import { Request, Response, NextFunction } from "express";
import { getSettingStatus } from "../services/settingService";
import { errorCode } from "../config/errorCode";
import { createError } from "../util/error";

// middleware need nextFunction
export const maintainance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const maintainance = await getSettingStatus("maintainance");
  if (maintainance?.value === "true") {
    return next(
      createError(
        "Server is currently under maintainance",
        503,
        errorCode.maintenance
      )
    );
  }
  next();
};
