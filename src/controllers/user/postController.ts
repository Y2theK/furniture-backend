import { body, param, query } from "express-validator";
import {
  getPostById,
  getPostLists,
  getPostWithRelation,
} from "../../services/postService";
import { Request, Response } from "express";
import { getUserById } from "../../services/authService";
import { checkModelIfNotExist, checkUserIfNotExist } from "../../util/auth";

interface CustomRequest extends Request {
  userId?: number;
}

export const getPost = [
  param("id", "Post id is required").trim().isInt({ min: 1 }),
  async (req: CustomRequest, res: Response) => {
    const user: any = await getUserById(req.userId!);
    checkUserIfNotExist(user);

    const { id: postId } = req.params;

    const post = await getPostWithRelation(+postId); //+postId is the same as parseInt(postId)
    checkModelIfNotExist(post);

    // const modifiedPost = {
    //   id: post?.id,
    //   title: post?.title,
    //   content: post?.content,
    //   body: post?.body,
    //   image: "/optimize/" + post?.image.split(".")[0] + ".webp",
    //   fullName:
    //     post?.author.firstName ?? "" + " " + post?.author.lastName ?? "",
    //   category: post?.category.name,
    //   type: post?.type.name,
    //   tags:
    //     post?.tags && post?.tags.length > 0
    //       ? post?.tags.map((tag) => tag.name)
    //       : null,
    //   updatedAt: post?.updatedAt.toLocaleDateString("en-US", {
    //     year: "numeric",
    //     month: "long",
    //     day: "numeric",
    //   }), // format date - "March 23, 2025"
    // };

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
  async (req: CustomRequest, res: Response) => {
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
    const posts = await getPostLists(options);
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

export const getInfinitePostsByPagination = () => {};
