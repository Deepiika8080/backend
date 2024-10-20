import express from 'express';
import { activateUser, deleteUser, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, SocialAuth, updateAccessToken, 
    updatePassword, UpdateProfilePicture, updateUserInfo, 
    updateUserRole} from '../controllers/user.controller';
import { authorizeRoles, is_Authenticated } from '../middleware/auth';
import { getCourses } from '../controllers/course.controller';
import { getUserAnalytics } from '../controllers/analytics.controller';

const userRouter = express.Router();
userRouter.post("/registration",registrationUser);
userRouter.post("/activate-user",activateUser);
userRouter.post("/login",loginUser);
userRouter.get('/logout',is_Authenticated,logoutUser);
userRouter.get("/refreshtoken",updateAccessToken);
userRouter.get("/getUser",is_Authenticated,getUserInfo);
userRouter.put("/update-user-info",is_Authenticated,updateUserInfo);
userRouter.post("/socialAuth",SocialAuth);
userRouter.put("/update-user-password",is_Authenticated,updatePassword);
userRouter.put("/update-user-avatar",is_Authenticated,UpdateProfilePicture);
userRouter.get("/get-all-users",is_Authenticated,authorizeRoles("admin"),getAllUsers);
userRouter.put("/update-user-role",is_Authenticated,authorizeRoles("admin"),updateUserRole);
userRouter.delete("/delete-user/:id",is_Authenticated,authorizeRoles("admin"),deleteUser);


export default userRouter;