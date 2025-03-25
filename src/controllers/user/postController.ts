import { param } from "express-validator";
import { getPostById } from "../../services/postService";
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

    const post = await getPostById(+postId);
    checkModelIfNotExist(post);

    res.status(200).json({
      message: "Post fetched successfully",
      post,
    });
  },
];

export const getPostsByPagination = () => {};

export const getInfinitePostsByPagination = () => {};
