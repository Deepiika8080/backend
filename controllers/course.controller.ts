import { catchAsyncError } from "../middleware/catchAsyncErrors";
import { NextFunction, Request, Response } from "express";
import cloudinary from "cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import { createCourse, getAllCourseservice } from "../services/course.service";
import courseModel from "../models/coursemodel";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import userModel, { Iuser } from "../models/userModel";
import { title } from "process";
import NotificationModel from "../models/notification.model";

export const uploadCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url
            }
        }
        createCourse(data, res, next);
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// edit course

export const editCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            await cloudinary.v2.uploader.destroy(thumbnail.public_id);

            const mycloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses"
            })

            data.thumbnail = {
                public_id: mycloud.public_id,
                url: mycloud.secure_url
            }
        }

        const courseId = req.params.id;

        const course = await courseModel.findByIdAndUpdate(
            courseId,
            {
                $set: data,
            },
            { new: true }
        );
        res.status(200).json({
            success: true,
            course
        });

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// get a single course === without purchasing
export const getSingleCourse = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const courseId = req.params.id;
        const cacheExists = await redis.get(courseId);
        if (cacheExists) {
            const course = JSON.parse(cacheExists);

            res.status(200).json({
                success: true,
                course
            });
        } else {
            const course = await courseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.question");
            // console.log("database is running");
            await redis.set(courseId, JSON.stringify(course),'EX',604800);
            res.status(200).json({
                success: true,
                course
            });
        }

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// GetAllCourses
export const getAllCourses = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const isCacheExists = await redis.get("allCourses");
        if (isCacheExists) {
            const courses = JSON.parse(isCacheExists);
            console.log("Reddis is running");
            res
                .status(200)
                .json({
                    success: true,
                    courses
                });
        } else {
            const courses = await courseModel.find().select(
                "-courseData.videoUrl -courseData.suggestion -courseData.links -courseData.question"
            );

            await redis.set("allCourses", JSON.stringify(courses));
            console.log("Reddis is not running");
            res
                .status(200)
                .json({
                    success: true,
                    courses
                });
        }
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// get course content - only for valid users
export const getCourseByUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userCoursesList = req.user?.courses;
        const courseId = req.params.id;

        const courseExists = userCoursesList?.find((course: any) => course._id.toString() === courseId);

        if (!courseExists) {
            return next(new ErrorHandler("You don't have access to this course :(", 400));
        }
        const course = await courseModel.findById(courseId);

        const content = course?.courseData;

        res.status(200).json({ message: true, content });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface Iquestion {
    question: String,
    courseId: String,
    contentId: string,
}
// add question
export const addQuestion = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { question, courseId, contentId }: Iquestion = req.body;

        const course = await courseModel.findById(courseId);

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid ContentId :(", 400));
        }

        const courseContent = course?.courseData?.find((data: any) => data._id.equals(contentId));

        if (!courseContent) {
            return next(new ErrorHandler("Invalid ContentId or courseiD:(", 400));
        }

        // createe a new question 
        const newquestion: any = {
            user: req.user,
            question,
            questionReplies: []
        }
        courseContent.question.push(newquestion);

        await NotificationModel.create({
            user:req.user?._id,
            title: "New Question ",
            message: `You have a new question in ${course?.name} course in the subpart of ${courseContent.title}`
        });

        await course?.save();

        res
        .status(200)
        .json({ message: true, course });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

interface Iquestion {
    answer: String,
    courseId: String,
    contentId: string,
    questionId: string,
}
// add answer
export const addAnswer = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { answer, questionId, courseId, contentId }: Iquestion = req.body;

        const course = await courseModel.findById(courseId);

        if (!mongoose.Types.ObjectId.isValid(contentId)) {
            return next(new ErrorHandler("Invalid ContentId :(", 400));
        }

        const courseContent = course?.courseData?.find((data: any) => data._id.equals(contentId));

        if (!courseContent) {
            return next(new ErrorHandler("Invalid ContentId or courseiD:(", 400));
        }

        const question = courseContent?.question?.find((data: any) => data._id.equals(questionId));

        if (!question) {
            return next(new ErrorHandler("Invalid questionId :(", 400));
        }
        const newAnswer: any = {
            user: req.user,
            answer,
        }

        question.questionReplies.push(newAnswer);

        await course?.save();

        if (req.user?._id === question.user._id) {

            // create a notification
            await NotificationModel.create({
                user: req.user?._id,
                title: "New Question Reply Received",
                message: `You have a new question reply in ${courseContent.title}`,
            });
        } else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            }
            const html = await ejs.renderFile(path.join(__dirname, "../mails/question-reply.ejs"), data);

            try {
                await sendMail({
                    email: question.user.email,
                    subject: "Question Reply",
                    template: "question-reply.ejs",
                    data
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 400));
            }
        }
        res.status(200).json({ success: true, course });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// add review in course
interface IAddReviewData {
    review: string,
    rating: number,
    userId: Iuser
}

export const addReview = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {

    const userCoursesList = req.user?.courses;
    const courseId = req.params.id;
    const isCourseExists = userCoursesList?.find((course: any) => course._id === courseId);

    try {
        if (!isCourseExists) {
            return next(new ErrorHandler("You don't Have access to it :(", 400));
        }

        const course = await courseModel.findById(req.params.id);

        const { review, rating } = req.body as IAddReviewData;

        const user = await userModel.findById(req.user?.id);
        const newReview: any = {
            comment: review,
            rating,
            user: req.user,
        }
        course?.reviews.push(newReview);

        let avg = 0;
        course?.reviews.forEach((rev: any) => { avg += rev.rating });
        if (course) {
            course.ratings = avg / course.reviews.length;
        }

        await course?.save();

        // notification added
        const notification = {
            title: "New Review Received",
            message: `${req.user?.name} has given a review in ${course?.name}`
        }

        res.status(200).json({ success: true, course });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

// add reply to the review 
interface IAddReplyToReview {
    replyToReview: string,
    courseId: string,
    reviewId: string
}

export const AddReviewReply = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
   try {
     const { replyToReview,courseId,reviewId } = req.body as IAddReplyToReview;
     const course = await courseModel.findById(courseId);
 
     if(!course) {
         return next(new ErrorHandler("Course not found :(", 400));
     }
 
     const review = course?.reviews?.find((review:any) => review._id.toString() === reviewId);
 
     if(!review) {
         return next(new ErrorHandler("Review not found :(", 400));
     }
     const replyData: any= {
         user: req.user,
         replyToReview
     }
     review?.commentReplies?.push(replyData);    
 
     await course.save();
 
     res.status(200).json({ success: true, course });
   } catch (error: any) {
    return next(new ErrorHandler(error.message, 400));
   }
});

export const getCourses = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
        try {
            getAllCourseservice(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// delete course
export const deleteCourse = async (req:Request,res: Response,next:NextFunction) => { 
    try {
     const {id} = req.params;
     const course = await courseModel.findById(id);
   
     if(!course) {
         return next(new ErrorHandler("course not found", 400)); 
     }
     await course.deleteOne({id});
 
     await redis.del(id);
     res
    .status(200)
    .json({
      success: true,
      message: "course deleted successfully"
    });
    } catch (error:any) {
     return next(new ErrorHandler(error.message, 400));
    }
 }
 