import jwt , { JwtPayload } from "jsonwebtoken";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncError } from "./catchAsyncErrors";
import { NextFunction, Request, Response } from "express"
import { redis } from "../utils/redis";

// authenticated user
export const is_Authenticated = catchAsyncError(async (req:Request,res:Response,next:NextFunction) => {
      const access_token = req.cookies?.access_token || req.headers['authorization']?.split(" ")[1] as string;
         
      if(!access_token) {
        return next(new ErrorHandler("User is not yet Logged in :(",400));
      }

      const decoded = jwt.verify(access_token,process.env.ACCESS_TOKEN as string) as JwtPayload;

      if(!decoded) {
        return next(new ErrorHandler("Access token is not valid ",400));
      }
     
      const user = await redis.get(decoded.id);

      if(!user) {
        return next(new ErrorHandler("User not found",400));
      }

      req.user = JSON.parse(user);
      console.log(req.user);
      next();
});

export const authorizeRoles = (...roles: string[]) => {
       return (req:Request,res:Response,next:NextFunction) => {
           if(!roles.includes(req.user?.role || '')) {
            return next(new ErrorHandler(`Role: ${req.user?.role} is not allowed to access this resource`,401));
           }
           next();
       }
}