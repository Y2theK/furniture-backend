import { body, param } from "express-validator";
import { getPostById, getPostWithRelation } from "../../services/postService";
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

    const modifiedPost = {
      id: post?.id,
      title: post?.title,
      content: post?.content,
      body: post?.body,
      image: "/optimize/" + post?.image.split(".")[0] + ".webp",
      fullName:
        post?.author.firstName ?? "" + " " + post?.author.lastName ?? "",
      category: post?.category.name,
      type: post?.type.name,
      tags:
        post?.tags && post?.tags.length > 0
          ? post?.tags.map((tag) => tag.name)
          : null,
      updatedAt: post?.updatedAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }), // format date - "March 23, 2025"
    };

    res.status(200).json({
      message: "Post fetched successfully",
      post: modifiedPost,
    });
  },
];

export const getPostsByPagination = () => {};

export const getInfinitePostsByPagination = () => {};
