import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import courseModel from "../models/coursemodel";
import userModel from "../models/userModel";

export const createCourse = catchAsyncError(async(data:any, res: Response) => {
         const course = await courseModel.create(data);
         res
         .status(200)
         .json({
            success: true,
            course
         });
         
});

export const getAllCourseservice = async (res: Response) => {
   const courses = await courseModel.find().sort({ createdAt: -1 });
 
   res
     .status(200)
     .json({
       success: true,
       courses
     });
 }