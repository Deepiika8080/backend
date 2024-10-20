import express from "express";
import { authorizeRoles, is_Authenticated } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controllers/order.controller";
import { getOrderAnalytics } from "../controllers/analytics.controller";

const orderRouter = express.Router();

orderRouter.post("/create-order",is_Authenticated,createOrder);

orderRouter.get("/get-all-orders",is_Authenticated,authorizeRoles("admin"),getAllOrders);

export default orderRouter;