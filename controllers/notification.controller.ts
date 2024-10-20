import { NextFunction, Request, Response } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import NotificationModel from "../models/notification.model";
import ErrorHandler from "../utils/ErrorHandler";
import cron from "node-cron";

// get all notification
export const getNotifications = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
       const notifications = await NotificationModel.find().sort({createdAt: -1});

       res
       .status(200)
       .json({ success: true, notifications });
    }catch(error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// update notification status
export const updateNotification = catchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const notification = await NotificationModel.findById(req.params.id);
    
            if(!notification) {
                return next(new ErrorHandler("notification not found ", 400));
            }
            if(notification.status = "un read") {
                notification.status = "read"
            }
            
            notification.save();
    
            res
            .status(200)
            .json({ success: true, notification });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);


// delete notification --- only admin
cron.schedule("0 0 0 * * *", async() => {
    const thirtyDaysAgo = new Date(Date.now() -30 * 24 * 60 * 60 * 1000);

    await NotificationModel.deleteMany({
        status: "read",
        createdAt: {$lt: thirtyDaysAgo}
    });
    console.log('Deleted read notifications');
});