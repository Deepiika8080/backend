import express from 'express';
import { addAnswer, addQuestion, addReview, AddReviewReply, deleteCourse, editCourse, getAllCourses, getCourseByUser, getCourses, getSingleCourse, uploadCourse } from '../controllers/course.controller';
import { authorizeRoles, is_Authenticated } from '../middleware/auth';
import { getCourseAnalytics } from '../controllers/analytics.controller';
const courseRouter = express.Router();

courseRouter.post("/create-course",is_Authenticated,authorizeRoles("admin"),uploadCourse);
courseRouter.post("/edit-course/:id",is_Authenticated,authorizeRoles("admin"),editCourse);

courseRouter.get("/get-course/:id",getSingleCourse);

courseRouter.get("/get-all-courses",getAllCourses);

courseRouter.get("/get-user-course/:id",is_Authenticated,getCourseByUser);

courseRouter.put("/add-question",is_Authenticated,addQuestion);

courseRouter.put("/add-answer",is_Authenticated,addAnswer);

courseRouter.put("/add-review/:id",is_Authenticated,addReview);

courseRouter.put("/add-reply-to-review",is_Authenticated,authorizeRoles("admin"),AddReviewReply);

courseRouter.get("/all-courses",is_Authenticated,authorizeRoles("admin"),getCourses);

courseRouter.delete("/delete-course/:id",is_Authenticated,authorizeRoles("admin"),deleteCourse);


export default courseRouter;