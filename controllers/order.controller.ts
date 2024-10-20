import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import userModel from "../models/userModel";
import ErrorHandler from "../utils/ErrorHandler";
import courseModel from "../models/coursemodel";
import { getAllOrderservice, newOrder } from "../services/order.service";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";
import { IOrder } from "../models/orderModel";

// create order
export const createOrder = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { courseId, payment_info } = req.body as IOrder;
        console.log(courseId);
        const user = await userModel.findById(req.user?._id);

        const courseAlreadyExists = user?.courses.find((course: any) => {
            console.log("course._id.toString() === courseId",course._id.toString(),courseId,course._id.toString() === courseId);
             return course.courseId.toString() === courseId;           
        });
        console.log(courseAlreadyExists);
        if (courseAlreadyExists) {
            return next(new ErrorHandler("You have already purchased this course :)", 400));
        }

        const course = await courseModel.findById(courseId);

        if (!course) {
            return next(new ErrorHandler("Course not found :(", 400));
        }

        const data: any = {
            userId: req.user?.id,
            courseId: course._id,
            payment_info
        }

        const mailData = {
            order: {
                _id: course._id?.toString().slice(0, 6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            }
        }

        const html = await ejs.renderFile(path.join(__dirname, '../mails/order-confirmation.ejs'), mailData);

        try {
            if (user) {
                await sendMail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "order-confirmation.ejs",
                    data: mailData
                })
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }

        //  user?.courses?.push({course._id as string});
        user?.courses?.push({ courseId: course._id as string });
        await user?.save();

        // send  a notification to the user
        await NotificationModel.create({
            user: user?._id,
            title: "New Order",
            message: `you have a new order from ${course?.name}`,
        });

        // Ensure the purchased count increments correctly
        if (course.purchased === undefined || course.purchased === null) {
            course.purchased = 0;
        }
        course.purchased += 1;

        await course.save();

        return newOrder(data, res, next);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// get all courses --- only for admin
export const getAllOrders = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
        try {
            getAllOrderservice(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);