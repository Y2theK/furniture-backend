import express, { NextFunction } from "express";
import "dotenv/config";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan"; // logging request
import { limiter } from "./middlewares/rateLimiter";
import { Request, Response } from "express";
import cookieParser from "cookie-parser";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";
import routes from "./routes/v1/index";
// everythings is middlewares in express
export const app = express(); // application object

var whitelist = ["http://example1.com", "http://localhost:5173"];
var corsOptions = {
  origin: function (
    origin: any,
    callback: (err: Error | null, origin?: any) => void
  ) {
    // Allow requests with no origin ( like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies or authorization header
};

app.use(morgan("dev")); // dev - format
app.use(express.urlencoded({ extended: true })); // parse request bodies to req.body object
app.use(express.json()); // parse json format to javascript
app.use(helmet()); // secure request header
app.use(compression()); // compress/zip response payload
app.use(limiter);
app.use(cors(corsOptions));
app.use(cookieParser());

app.use(express.static("upload/images")); // serve static files // public access

// localization middleware
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    backend: {
      loadPath: path.join(
        process.cwd(),
        "src/localization",
        "{{lng}}",
        "{{ns}}.json"
      ),
    },
    detection: {
      order: ["querystring", "cookie"],
      cache: ["cookie"],
      fallbackLng: "en",
      preload: ["en", "mm"],
    },
  }); // internationalization
app.use(middleware.handle(i18next));
app.use(routes);

// error handling
app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  const status = error.status || 500;
  const message = error.message || "Something went wrong.";
  const errorCode = error.code || "Error_Code";

  res.status(status).json({
    message,
    error: errorCode,
  });
});
