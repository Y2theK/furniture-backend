import { body, param, query, validationResult } from "express-validator";
import {
  getProductById,
  getProductLists,
  getProductWithRelation,
} from "../../services/productService";
import { NextFunction, Request, Response } from "express";
import { getUserById } from "../../services/authService";
import { checkModelIfNotExist, checkUserIfNotExist } from "../../util/auth";
import { createError } from "../../util/error";
import { errorCode } from "../../config/errorCode";
import { getOrSetCache } from "../../util/cache";

interface CustomRequest extends Request {
  userId?: number;
}

export const getProduct = [
  param("id", "Product id is required").trim().isInt({ min: 1 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }
    const user: any = await getUserById(req.userId!);
    checkUserIfNotExist(user);

    const { id: productId } = req.params;

    // const product = await getProductWithRelation(+productId); //+productId is the same as parseInt(productId)
    const cacheKey = `products:${JSON.stringify(+productId)}`;
    const product = await getOrSetCache(cacheKey, async () => {
      return await getProductWithRelation(+productId);
    });

    checkModelIfNotExist(product);

    res.status(200).json({
      message: "Product fetched successfully",
      product: product,
    });
  },
];

export const getProductsByPagination = [
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
        name: true,
        description: true,
        price: true,
        updatedAt: true,
        images: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    };
    // const products = await getProductLists(options);

    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const products = await getOrSetCache(cacheKey, async () => {
      return await getProductLists(options);
    });
    const hasNextPage = products.length > +limit;
    let nextPage = null;
    const prevPage = +page !== 1 ? +page - 1 : null;
    if (hasNextPage) {
      products.pop();
      nextPage = +page + 1;
    }

    res.status(200).json({
      message: "Product fetched successfully",
      products,
      currentPage: page,
      hasNextPage,
      prevPage,
      nextPage,
    });
  },
];

export const getInfiniteProductsByPagination = [
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
        name: true,
        description: true,
        price: true,
        updatedAt: true,
        images: {
          include: true,
        },
      },
      orderBy: {
        id: "asc",
      },
    };
    // const products = await getProductLists(options);
    const cacheKey = `products:${JSON.stringify(req.query)}`;
    const products = await getOrSetCache(cacheKey, async () => {
      return await getProductLists(options);
    });
    const hasNextPage = products.length > +limit;
    const newCursor =
      products.length > 0 ? products[products.length - 1].id : null;
    if (hasNextPage) {
      products.pop();
    }

    res.status(200).json({
      message: "Product fetched successfully",
      products,
      currentCursor: lastCursor,
      hasNextPage,
      newCursor,
    });
  },
];
