import { Request, Response, NextFunction } from "express";
import multer, { FileFilterCallback } from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "upload/images");
  },
  filename: function (req, file, cb) {
    const ext = file.mimetype.split("/")[1];
    const uniqueSuffix =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + "." + ext;
    cb(null, uniqueSuffix);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};
const upload = multer({
  storage: storage,
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 5, // 5 mb
  },
});

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10 mb => image optimization is needed
  },
});

export default upload;
