import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { createError } from "../../util/error";
import { getUserById } from "../../services/authService";
import { checkUserIfNotExist } from "../../util/auth";
import { checkFileIfNotExist } from "../../util/check";
import imageQueue from "../../jobs/queues/imageQueue";
import { createOnePost, PostArgs } from "../../services/postService";

interface CustomRequest extends Request {
  userId?: number;
}
export const createPost = [
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required").trim().notEmpty().escape(),
  body("category", "Category is required").trim().notEmpty().escape(),
  body("type", "Type is required").trim().notEmpty().escape(),
  body("tags", "Tags is invalid")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { title, content, body, category, type, tags } = req.body;
    const userId = req.userId;
    const image = req.file;
    const user: any = await getUserById(userId!);
    checkUserIfNotExist(user);
    checkFileIfNotExist(image);

    const fileName = image?.filename.split(".")[0] + ".webp";

    // add a job to the queue
    await imageQueue.add(
      "optimizeImage",
      {
        filePath: image?.path,
        fileName: fileName,
        width: 835,
        height: 577,
        quality: 80,
      },
      {
        attempts: 3, // retry 3 times
        backoff: {
          type: "exponential", // wait time between retries
          delay: 1000,
        },
      }
    );

    const postData: PostArgs = {
      title,
      content,
      body,
      image: req.file!.filename,
      category,
      type,
      tags,
      authorId: userId!,
    };

    const post = await createOnePost(postData);

    res.status(201).json({
      message: "Post created successfully",
      post,
    });
  },
];

export const updatePost = [
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required").trim().notEmpty().escape(),
  body("category", "Category is required").trim().notEmpty().escape(),
  body("type", "Type is required").trim().notEmpty().escape(),
  body("tags", "Tags is invalid")
    .optional({ nullable: true })
    .customSanitizer((value) => {
      if (value) {
        return value.split(",").filter((tag: string) => tag.trim() !== "");
      }
      return value;
    }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { title, content, body, category, type, tags } = req.body;
    const userId = req.userId;
    const image = req.file;
    const user: any = await getUserById(userId!);
    checkUserIfNotExist(user);
    checkFileIfNotExist(image);

    const fileName = image?.filename.split(".")[0] + ".webp";

    // add a job to the queue
    await imageQueue.add(
      "optimizeImage",
      {
        filePath: image?.path,
        fileName: fileName,
        width: 835,
        height: 577,
        quality: 80,
      },
      {
        attempts: 3, // retry 3 times
        backoff: {
          type: "exponential", // wait time between retries
          delay: 1000,
        },
      }
    );

    const postData: PostArgs = {
      title,
      content,
      body,
      image: req.file!.filename,
      category,
      type,
      tags,
      authorId: userId!,
    };

    const post = await createOnePost(postData);

    res.status(201).json({
      message: "Post created successfully",
    });
  },
];
export const deletePost = [
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    res.status(201).json({
      message: "Post created successfully",
    });
  },
];
