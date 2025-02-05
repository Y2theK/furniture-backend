import express, { NextFunction } from "express";
import "dotenv/config";
import helmet from "helmet";
import compression from "compression";
import cors from 'cors';
import morgan from "morgan"; // logging request
import { limiter } from "./middlewares/rateLimiter";
import { Request, Response } from "express";
import healthRoutes from "./routes/v1/health";

// everythings is middlewares in express
export const app = express(); // application object

app.use(morgan("dev")); // dev - format
app.use(express.urlencoded({ extended: true })); // parse request bodies to req.body object 
app.use(express.json()); // parse json format to javascript
app.use(helmet()); // secure request header
app.use(compression()); // compress/zip response payload
app.use(limiter);
app.use(cors());

app.use("/api/v1", healthRoutes);

// error handling
app.use((error: any,req: Request,res: Response, next: NextFunction) => {
    const status = error.status || 500;
    const message = error.message || "Something went wrong.";
    const errorCode = error.errorCode || "Error_Code";

    res.status(status).json({
        message,
        error: errorCode
    });
});


