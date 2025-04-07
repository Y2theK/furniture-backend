import { NextFunction, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { errorCode } from "../../config/errorCode";
import { createError } from "../../util/error";
import { getUserById } from "../../services/authService";
import { checkModelIfNotExist, checkUserIfNotExist } from "../../util/auth";
import { checkFileIfNotExist } from "../../util/check";
import imageQueue from "../../jobs/queues/imageQueue";
import {
  createOneProduct,
  deleteOneProduct,
  getProductById,
  ProductArgs,
  updateOneProduct,
} from "../../services/productService";
import sanitizeHtml from "sanitize-html";
import { unlink } from "fs";
import path from "path";
import cacheQueue from "../../jobs/queues/cacheQueue";

interface CustomRequest extends Request {
  userId?: number;
  files?: any;
}

const removeFiles = async (
  originalFiles: string[],
  optimizeFiles: string[] | null
) => {
  try {
    for (const originalFile of originalFiles) {
      //delete original images
      const originalFilePath = path.join(
        __dirname,
        "../../../",
        "upload/images/",
        originalFile
      );
      await unlink(originalFilePath, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }

    if (optimizeFiles) {
      for (const optimizeFile of optimizeFiles) {
        // delete optimized images
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
    }
  } catch (error) {
    console.log(error);
  }
};
export const createProduct = [
  body("name", "Name is required").trim().notEmpty().escape(),
  body("description", "Description is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => {
      return sanitizeHtml(value);
    }),
  body("price", "Price is required")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("discount", "Discount is required")
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Inventory is required").isInt({ min: 1 }),
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
      if (req.files && req.files.length > 0) {
        const originalFiles = req.files.map((file: any) => file.filename);
        await removeFiles(originalFiles, null);
      }
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const {
      name,
      description,
      price,
      discount,
      inventory,
      category,
      type,
      tags,
    } = req.body;

    checkFileIfNotExist(req.files && req.files.length > 0);

    await Promise.all(
      req.files.map(async (file: any) => {
        const fileName = file?.filename.split(".")[0] + ".webp";
        // add a job to the queue
        return imageQueue.add(
          "optimizeImage",
          {
            filePath: file?.path,
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
      })
    );

    const originalFileNames = req.files.map((file: any) => ({
      path: file.filename,
    }));

    const productData: ProductArgs = {
      name,
      description,
      price,
      discount,
      inventory: +inventory,
      category,
      type,
      tags,
      images: originalFileNames,
    };

    // console.log(productData);

    const product = await createOneProduct(productData);
    await cacheQueue.add(
      "invalidate-product-cache",
      {
        pattern: "products:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      }
    );

    res.status(201).json({
      message: "Product created successfully",
      product,
    });
  },
];

export const updateProduct = [
  body("productId", "Product id is required").trim().isInt({ min: 1 }),
  body("name", "Name is required").trim().notEmpty().escape(),
  body("description", "Description is required")
    .trim()
    .notEmpty()
    .customSanitizer((value) => {
      return sanitizeHtml(value);
    }),
  body("price", "Price is required")
    .isFloat({ min: 0.1 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("discount", "Discount is required")
    .isFloat({ min: 0 })
    .isDecimal({ decimal_digits: "1,2" }),
  body("inventory", "Inverntory is required").isInt({ min: 1 }),
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

    const {
      productId,
      name,
      description,
      price,
      discount,
      inventory,
      category,
      type,
      tags,
    } = req.body;

    const product: any = await getProductById(parseInt(productId));
    if (!product) {
      if (req.files && req.files.length > 0) {
        const originalFiles = req.files.map((file: any) => file.filename);
        const optimizeFiles = req.files.map(
          (file: any) => file.filename.split(".")[0] + ".webp"
        );
        await removeFiles(originalFiles, optimizeFiles);
      }
      return next(
        createError("Product Id not exists.", 400, errorCode.invalid)
      );
    }

    if (req.files && req.files.length > 0) {
      // delete images
      const originalFiles = product.images.map((file: any) => file.path);
      const optimizeFiles = product.images.map(
        (file: any) => file.path.split(".")[0] + ".webp"
      );
      await removeFiles(originalFiles, optimizeFiles);
    }

    if (req.files && req.files.length > 0) {
      await Promise.all(
        req.files.map(async (file: any) => {
          const fileName = file.filename.split(".")[0] + ".webp";
          // add a job to the queue
          return imageQueue.add(
            "optimizeImage",
            {
              filePath: file?.path,
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
        })
      );
    }

    await cacheQueue.add(
      "invalidate-product-cache",
      {
        pattern: "products:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      }
    );

    let originalFileNames = [];
    if (req.files && req.files.length > 0) {
      originalFileNames = req.files.map((file: any) => ({
        path: file.filename,
      }));
    }

    // console.log(originalFileNames);

    let productData: any = {
      name,
      description,
      price,
      discount,
      inventory: +inventory,
      category,
      type,
      tags,
      images: originalFileNames,
    };
    const productUpdated = await updateOneProduct(product.id, productData);

    res.status(201).json({
      message: "Product updated successfully",
      product: productUpdated,
    });
  },
];

export const deleteProduct = [
  body("productId", "Product id is required").trim().isInt({ min: 1 }),
  async (req: CustomRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req).array({ onlyFirstError: true });
    if (errors.length > 0) {
      return next(createError(errors[0].msg, 400, errorCode.invalid));
    }

    const { productId } = req.body;
    const userId = req.userId;
    const image = req.file;

    const product: any = await getProductById(parseInt(productId));
    checkModelIfNotExist(product);

    const productDeleted = await deleteOneProduct(parseInt(productId));

    // delete images
    const originalFiles = product.images.map((file: any) => file.filename);
    const optimizeFiles = product.images.map(
      (file: any) => file.path.split(".")[0] + ".webp"
    );
    await removeFiles(originalFiles, optimizeFiles);

    await cacheQueue.add(
      "invalidate-product-cache",
      {
        pattern: "products:*",
      },
      {
        jobId: `invalidate-${Date.now()}`,
        priority: 1,
      }
    );

    res.status(201).json({
      message: "Product deleted successfully",
      product: productDeleted,
    });
  },
];
