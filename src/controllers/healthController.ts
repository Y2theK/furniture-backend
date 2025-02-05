
import { Request,Response } from "express";

interface CustomRequest extends Request {
    userId?: number,
};

export const healthCheck = (req:CustomRequest, res:Response) => {
    res.status(200).json({
        message: "Server is running good.", 
        userId: req.userId
    });
}


