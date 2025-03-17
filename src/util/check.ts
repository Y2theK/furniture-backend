import { errorCode } from "../config/errorCode";

export const checkFileIfNotExist = (file: any) => {
  if (!file) {
    const error: any = new Error("Invalid Image.");
    error.status = 409;
    error.code = errorCode.invalid;
    throw error;
  }
};
