import { body, param, query, validationResult } from "express-validator";
import {
  getPostById,
  getPostLists,
  getPostWithRelation,
} from "../../services/postService";
import { NextFunction, Request, Response } from "express";
import { getUserById } from "../../services/authService";
import { checkModelIfNotExist, checkUserIfNotExist } from "../../util/auth";
import { createError } from "../../util/error";
import { errorCode } from "../../config/errorCode";
import { getOrSetCache } from "../../util/cache";

interface CustomRequest extends Request {
  userId?: number;
}

export const getPost = [
  param("id", "Post id is required").trim().isInt({ min: 1 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const user: any = await getUserById(req.userId!);
    checkUserIfNotExist(user);

    const { id: postId } = req.params;

    // const post = await getPostWithRelation(+postId); //+postId is the same as parseInt(postId)
    const cacheKey = `posts:${JSON.stringify(+postId)}`;
    const post = await getOrSetCache(cacheKey, async () => {
      return await getPostWithRelation(+postId);
    });

    checkModelIfNotExist(post);

    res.status(200).json({
      message: "Post fetched successfully",
      post: post,
    });
  },
];

export const getPostsByPagination = [
  query("page", "Page Number must be unsigned integer")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit number must be unsigned integer")
    .isInt({ gt: 4 })
    .optional(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const page = req.query.page || 1;
    const limit = req.query.limit || 5;
    const user: any = await getUserById(req.userId!);
    checkUserIfNotExist(user);

    const skip = (+page - 1) * +limit; //+limit is converting string to integer
    const options = {
      skip,
      take: +limit + 1,
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullname: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    };
    // const posts = await getPostLists(options);

    const cacheKey = `posts:${JSON.stringify(req.query)}`;
    const posts = await getOrSetCache(cacheKey, async () => {
      return await getPostLists(options);
    });
    const hasNextPage = posts.length > +limit;
    let nextPage = null;
    const prevPage = +page !== 1 ? +page - 1 : null;
    if (hasNextPage) {
      posts.pop();
      nextPage = +page + 1;
    }

    res.status(200).json({
      message: "Post fetched successfully",
      posts,
      currentPage: page,
      hasNextPage,
      prevPage,
      nextPage,
    });
  },
];

export const getInfinitePostsByPagination = [
  query("cursor", "Cursor Number must be unsigned integer")
    .isInt({ gt: 0 })
    .optional(),
  query("limit", "Limit number must be unsigned integer")
    .isInt({ gt: 4 })
    .optional(),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const lastCursor = req.query.cursor;
    const limit = req.query.limit || 5;
    const user: any = await getUserById(req.userId!);
    checkUserIfNotExist(user);

    const options = {
      skip: lastCursor ? 1 : 0,
      take: +limit + 1,
      cursor: lastCursor ? { id: +lastCursor } : undefined,
      select: {
        id: true,
        title: true,
        content: true,
        image: true,
        updatedAt: true,
        author: {
          select: {
            fullname: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    };
    // const posts = await getPostLists(options);
    const cacheKey = `posts:${JSON.stringify(req.query)}`;
    const posts = await getOrSetCache(cacheKey, async () => {
      return await getPostLists(options);
    });
    const hasNextPage = posts.length > +limit;
    const newCursor = posts.length > 0 ? posts[posts.length - 1].id : null;
    if (hasNextPage) {
      posts.pop();
    }

    res.status(200).json({
      message: "Post fetched successfully",
      posts,
      currentCursor: lastCursor,
      hasNextPage,
      newCursor,
    });
  },
];
