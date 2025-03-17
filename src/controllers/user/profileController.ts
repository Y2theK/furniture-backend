import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { body, query, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { createError } from "../../util/error";
import { getUserById, updateUser } from "../../services/authService";
import { checkUserIfNotExist } from "../../util/auth";
import { checkFileIfNotExist } from "../../util/check";
import { unlink } from "fs";
import path from "path";

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
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { lng } = req.query;

    res.cookie("i18next", "lng");
    res.status(200).json({
      message: req.t("changeLang", { lang: lng }),
    });
  },
];

export const uploadProfile = async (
  req: CustomRequest,
  res: Response,
  next: NextFunction
) => {
  const userId = req.userId;
  const image = req.file;
  const user: any = await getUserById(userId!);
  checkUserIfNotExist(user);
  checkFileIfNotExist(image);

  const fileName = image?.filename;

  // delete old image
  if (user.image) {
    // we have to use path.join to get the correct path
    const filePath = path.join(
      __dirname,
      "../../../",
      "upload/images/",
      user.image // in window system we get upload\\image.jpg so we need to replace it to upload/image.jpg
    );
    await unlink(filePath, (err) => {
      if (err) {
        console.log(err);
      }
    });
  }

  // update new image
  await updateUser(userId!, { image: fileName });

  res.status(200).json({
    message: "Profile Picture Uploaded",
    image: fileName,
  });
};
