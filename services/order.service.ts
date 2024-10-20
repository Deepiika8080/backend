import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import userModel from "../models/userModel";
import ErrorHandler from "../utils/ErrorHandler";
import OrderModel from "../models/orderModel";

export const newOrder = catchAsyncError(async (data: any, res: Response, next: NextFunction) => {
    const order = await OrderModel.create(data);
    
    res.status(200).json({ success: true, order });
});

export const getAllOrderservice = async (res: Response) => {
    const orders = await OrderModel.find().sort({ createdAt: -1 });
  
    res
      .status(200)
      .json({
        success: true,
        orders
      });
  }
  