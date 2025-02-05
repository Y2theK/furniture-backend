import { Request, Response, NextFunction } from "express";
interface CustomRequest extends Request {
    userId?: number,
};
// middleware need nextFunction
export const check = (req: CustomRequest, res: Response, next: NextFunction) => {
    const err: any = new Error("An Error Occured");
    err.status = 500;
    err.errorCode = "Human Error";
    return next(err); // middleware ka error pyn chin yin return next(err)

    req.userId = 123;
    next();
};