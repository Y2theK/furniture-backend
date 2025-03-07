import express, { NextFunction } from "express";
import "dotenv/config";
import helmet from "helmet";
import compression from "compression";
import cors from "cors";
import morgan from "morgan"; // logging request
import { limiter } from "./middlewares/rateLimiter";
import auth from "./middlewares/auth";
import { Request, Response } from "express";
import healthRoutes from "./routes/v1/health";
import AuthRoutes from "./routes/v1/auth";
import AdminRoutes from "./routes/v1/admin/admin";
import UserRoutes from "./routes/v1/user/user";
import cookieParser from "cookie-parser";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";
import path from "path";
import { authorize } from "./middlewares/authorize";
// everythings is middlewares in express
export const app = express(); // application object

var whitelist = ["http://example1.com", "http://localhost:5173"];
var corsOptions = {
  origin: function (
    origin: any,
    callback: (err: Error | null, origin?: any) => void
  ) {
    if (!origin) return callback(null, true); // allow request with no origin like mobile or curl or postman
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credential: true, // allow cookies or authentication header
};

app.use(morgan("dev")); // dev - format
app.use(express.urlencoded({ extended: true })); // parse request bodies to req.body object
app.use(express.json()); // parse json format to javascript
app.use(helmet()); // secure request header
app.use(compression()); // compress/zip response payload
app.use(limiter);
app.use(cors(corsOptions));
app.use(cookieParser());
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
app.use("/api/v1", healthRoutes);
app.use("/api/v1", AuthRoutes);
app.use("/api/v1/admin", auth, authorize(true, "ADMIN"), AdminRoutes);
app.use("/api/v1", UserRoutes);

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
