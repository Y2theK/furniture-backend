import { Request, Response, NextFunction } from "express";
interface CustomRequest extends Request {
    userId?: number,
};
// middleware need nextFunction
export const check = (req: CustomRequest, res: Response, next: NextFunction) => {
    req.userId = 123;
    next();
};