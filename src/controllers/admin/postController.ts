import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { createError } from "../../util/error";
import { getUserById } from "../../services/authService";
import { checkUserIfNotExist } from "../../util/auth";
import { checkFileIfNotExist } from "../../util/check";
import imageQueue from "../../jobs/queues/imageQueue";
import {
  createOnePost,
  getPostById,
  PostArgs,
  updateOnePost,
} from "../../services/postService";
import sanitizeHtml from "sanitize-html";
import { unlink } from "fs";
import path from "path";
interface CustomRequest extends Request {
  userId?: number;
}

const removeFiles = async (
  originalfile: string,
  optimizeFile: string | null
) => {
  try {
    //delete original image
    const originalFilePath = path.join(
      __dirname,
      "../../../",
      "upload/images/",
      originalfile
    );
    await unlink(originalFilePath, (err) => {
      if (err) {
        console.log(err);
      }
    });

    if (optimizeFile) {
      // delete optimized image
      const optimizeFilePath = path.join(
        __dirname,
        "../../../",
        "upload/optimize/",
        optimizeFile
      );

      await unlink(optimizeFilePath, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  } catch (error) {
    console.log(error);
  }
};
export const createPost = [
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => {
      return sanitizeHtml(value);
    }),
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
      req.file && (await removeFiles(req.file!.filename, null));
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { title, content, body, category, type, tags } = req.body;
    const userId = req.userId;
    const image = req.file;
    checkFileIfNotExist(image);
    const user: any = await getUserById(userId!);
    checkUserIfNotExist(user);

    if (!user) {
      req.file && (await removeFiles(image!.filename, null));
      return next(createError("User not exists.", 409, errorCode.invalid));
    }

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
  body("postId", "Post id is required").trim().isInt({ min: 1 }),
  body("title", "Title is required").trim().notEmpty().escape(),
  body("content", "Content is required").trim().notEmpty().escape(),
  body("body", "Body is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => {
      return sanitizeHtml(value);
    }),
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

    const { postId, title, content, body, category, type, tags } = req.body;
    const userId = req.userId;
    const image = req.file;
    const user: any = await getUserById(userId!);
    checkUserIfNotExist(user);
    if (!user) {
      req.file && (await removeFiles(image!.filename, null));
      return next(createError("User not exists.", 409, errorCode.invalid));
    }
    const post: any = await getPostById(parseInt(postId));
    if (!post) {
      req.file && (await removeFiles(image!.filename, null));
      return next(createError("Post Id not exists.", 400, errorCode.invalid));
    }

    if (post.authorId !== userId) {
      req.file && (await removeFiles(image!.filename, null));
      return next(
        createError("You cannot delete this post.", 403, errorCode.unauthorised)
      );
    }

    let postData: any = {
      title,
      content,
      body,
      category,
      type,
      tags,
    };

    if (req.file) {
      postData.image = req.file.filename;

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

      // delete images
      const optimizeFile = post.image.split(".")[0] + ".webp";
      await removeFiles(post.image, optimizeFile);
    }

    const postUpdated = await updateOnePost(post.id, postData);

    res.status(201).json({
      message: "Post updated successfully",
      post: postUpdated,
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
