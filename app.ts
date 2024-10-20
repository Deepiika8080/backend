require("dotenv").config();
import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import { ErrorHandlerMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import courseRouter from "./routes/course.route";
import orderRouter from "./routes/order.route";
import notificationRouter from "./routes/notification.route";
import layoutRouter from "./routes/layout.route";

export const app = express();

// body-parser
app.use(express.json({ limit: "50mb" }));

// cookie parser
app.use(cookieParser());

// cors 

app.use(cors({
  origin: 'http://localhost:3000', // Allow requests from the frontend
  credentials: true, // Include credentials such as cookies
}));


app.use("/api/v1",userRouter,courseRouter,orderRouter,notificationRouter,layoutRouter);

// Testing api
app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({ success: true, message: "API IS WORKING" });
})

// other unknown routes
app.all("*",(req:Request,res:Response,next:NextFunction) => {
    const errmsg = new Error(`Page not found at ${req.originalUrl}`) as any;
    errmsg.statusCode = 404;
    next(errmsg);
})
// console.log("type",typeof ErrorHandlerMiddleware); // Should log 'function'

app.use(ErrorHandlerMiddleware);
