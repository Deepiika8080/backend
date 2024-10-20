import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import userModel from "../models/userModel";
import ErrorHandler from "../utils/ErrorHandler";
import courseModel from "../models/coursemodel";
import OrderModel from "../models/orderModel";

// get user analytics for admin
export const getUserAnalytics = catchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const users = await generateLast12MonthsData(userModel);

        res
        .status(200)
        .json({
            success: true,
            users
        });
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// get course analytics for admin
export const getCourseAnalytics = catchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const courses = await generateLast12MonthsData(courseModel);

        res
        .status(200)
        .json({
            success: true,
            courses
        });
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// get orders analytics for admin
export const getOrderAnalytics = catchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const orders = await generateLast12MonthsData(OrderModel);

        res
        .status(200)
        .json({
            success: true,
            orders
        });
    } catch (error:any) {
        return next(new ErrorHandler(error.message, 400));
    }
});