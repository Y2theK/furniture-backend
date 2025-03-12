import { Request, Response, NextFunction } from "express";
import { getSettingStatus } from "../services/settingService";
import { errorCode } from "../config/errorCode";
import { createError } from "../util/error";

const whitelists = ["127.0.0.1"];
// middleware need nextFunction
export const maintainance = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const ip: any = req.headers["x-forward-for"] || req.socket.remoteAddress; // x-forward-for for load banlancer setup

  if (whitelists.includes(ip)) {
    console.log(ip);
    next();
  } else {
    console.log(ip);

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
  }
};
