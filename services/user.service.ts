import { NextFunction, Response } from "express"
import userModel from "../models/userModel"
import ErrorHandler from "../utils/ErrorHandler";

export const getUserById = async (id: string, res: Response) => {
  const user = await userModel.findById(id);
 
  res
    .status(200)
    .json({
      success: true,
      user
    })
};

// get all users
export const getAllUsersservice = async (res: Response) => { 
  const users = await userModel.find().sort({ createdAt: -1 });
  
    res
    .status(200)
    .json({
      success: true,
      users
    })
}

// update user role
export const updateuserRoleService = async (res: Response,role:string,id:string,next:NextFunction) => { 
     console.log("service id",id);
     const user = await userModel.findByIdAndUpdate(id,{role},{new: true});
     console.log("user",user);
   
     res
    .status(200)
    .json({
      success: true,
      user
    });
}



