import express from "express";
import { authorizeRoles, is_Authenticated } from "../middleware/auth";
import { getNotifications, updateNotification } from "../controllers/notification.controller";

const notificationRouter = express.Router();

notificationRouter.get("/get-notifications",is_Authenticated,authorizeRoles("admin"),getNotifications);

notificationRouter.put("/update-notification/:id",is_Authenticated,authorizeRoles("admin"),updateNotification);

export default notificationRouter;
