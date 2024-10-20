import express from 'express';
import { authorizeRoles, is_Authenticated } from '../middleware/auth';
import { createLayout, editLayout, getLayoutByType } from '../controllers/layout.controller';
const layoutRouter = express.Router();

layoutRouter.post("/create-layout",is_Authenticated,authorizeRoles("admin"),createLayout);
layoutRouter.put("/edit-layout",is_Authenticated,authorizeRoles("admin"),editLayout);
layoutRouter.get("/get-layout-data",getLayoutByType);
export default layoutRouter;