import express from 'express';
import { authorizeRoles, is_Authenticated } from '../middleware/auth';
import { getCourseAnalytics, getOrderAnalytics, getUserAnalytics } from '../controllers/analytics.controller';
const analyticsRouter = express.Router();

analyticsRouter.get("/get-courses-analytics",is_Authenticated,authorizeRoles("admin"),getCourseAnalytics);
analyticsRouter.get("/get-order-analytics",is_Authenticated,authorizeRoles("admin"),getOrderAnalytics);
analyticsRouter.get("/get-user-analytics",is_Authenticated,authorizeRoles("admin"),getUserAnalytics);

export default analyticsRouter;