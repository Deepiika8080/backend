import {Request, Response ,NextFunction } from "express";
import { catchAsyncError } from "../middleware/catchAsyncErrors";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import layoutModel from "../models/layout.model";

// create Layout
export const createLayout = catchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const {type} = req.body;
      
        const isTypeExists = await layoutModel.findOne({type});
        
        if(isTypeExists) {
            return next(new ErrorHandler(`${type} already exists`, 400));
        }

        if(type === "Banner") {
            const {image,title,subTitle} = req.body;
            const myCloud = await cloudinary.v2.uploader.upload(image,{
                folder: "layout"
            });
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
                title,
                subTitle
            }
            await layoutModel.create(banner);
        }
        if(type === "FAQ") {
            const {faq} = req.body;
            const faqItems = await Promise.all(
                faq.map(async (item: any) => {
                    return {
                        question: item.question,
                        answer: item.answer
                    }
                })
            )
            await layoutModel.create({type: "FAQ",faq: faqItems});
        }
        if(type === "Catagories") {
           
            const {catagories} = req.body;
            const catagoryItems = await Promise.all(
                catagories.map(async (item: any) => {
                      return {
                        title: item.title,
                      }
                })
            );           
            await layoutModel.create({
                type: "Catagories",
                catagories: catagoryItems,
            });
        }

        res
        .status(200)
        .json({
          success: true,
          message: "Layout created successfully"
        });
    } catch (error: any) {
        console.log(error);
        return next(new ErrorHandler(`E:)${error.message}`, 400));
    }
});

// edit layout
export const editLayout = catchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const {type} = req.body;        
        if(type === "Banner") {
            const bannerData:any = await layoutModel.findOne({type: "Banner"});
            const {image,title,subTitle} = req.body;
            if(bannerData) {
                await cloudinary.v2.uploader.destroy(bannerData.image.public_id);
            }
            const myCloud = await cloudinary.v2.uploader.upload(image,{
                folder: "layout"
            });
            const banner = {
                type: "Banner",
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
                title,
                subTitle,
            }
            await layoutModel.findByIdAndUpdate(bannerData._id,{banner});
        }
        if(type === "FAQ") {
            const {faq} = req.body;
            const FaqItem = await layoutModel.findOne({type: "FAQ"});
            const faqItems = await Promise.all(
                faq.map(async (item: any) => {
                    return {
                        question: item.question,
                        answer: item.answer
                    }
                })
            );
            await layoutModel.findByIdAndUpdate(FaqItem?._id,{type: "FAQ", faq: faqItems});
        }
        if(type === "Catagories") {          
            const {catagories} = req.body;
            const catagoriesData = await layoutModel.findOne({type : "Catagories"});
            const catagoryItems = await Promise.all(
                catagories.map(async (item: any) => {
                      return {
                        title: item.title,
                      }
                })
            );           
            await layoutModel.findByIdAndUpdate(catagoriesData?._id,{
                type: "Catagories",
                catagories: catagoryItems,
            });
        }

        res
        .status(200)
        .json({
          success: true,
          message: "Layout updated successfully"
        });
    } catch (error: any) {
       
        return next(new ErrorHandler(`E:)${error.message}`, 400));
    }
});

// get layout by type
export const getLayoutByType = catchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const {type} = req.body;        
        const layoutData = await layoutModel.findOne({type:type});
        
        if(!layoutData) {
            return next(new ErrorHandler(` No Data found for ${type})`, 400));
        }
        res
        .status(200)
        .json({
          success: true,
          layoutData
        });
    } catch (error: any) {
        
        return next(new ErrorHandler(`E:)${error.message}`, 400));
    }
});