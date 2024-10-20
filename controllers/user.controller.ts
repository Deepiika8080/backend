import { NextFunction, Request, Response } from "express"
import { catchAsyncError } from "../middleware/catchAsyncErrors"
import userModel, { Iuser } from "../models/userModel";
import ErrorHandler from "../utils/ErrorHandler";
import ejs from "ejs";
import path from "path";
import jwt,{ JwtPayload, Secret } from "jsonwebtoken";
import sendMail from "../utils/sendMail";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { getAllUsersservice, getUserById, updateuserRoleService } from "../services/user.service";
import cloudinary from "cloudinary";

// interface for user
interface IRegistrationBody {
    name: string,
    email: string,
    password: string,
    avatar?: string
}

export const registrationUser = catchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;
        const isEmailExists = await userModel.findOne({ email });
        if (isEmailExists) {
            return next(new ErrorHandler("Email already exists", 400));
        }

        const user: IRegistrationBody = {
            name,
            email,
            password
        };

        const activationToken = createActivationToken(user);

        const activationCode = activationToken.activationCode;

        const data = { user: { name: user.name }, activationCode };
        const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data)

        try {
            await sendMail({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mail.ejs",
                data,
            });

            res.status(201).json({
                success: true,
                message: "PLease check your email to activate youor account",
                activationToken: activationToken.token
            })
        } catch (e:any) {
            return next(new ErrorHandler(e.message, 400));
        }
    } catch (e: any) {
        return next(new ErrorHandler(e.message, 400));
    }
});

interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random()*9000).toString();
    const token = jwt.sign(
        {
            user,
            activationCode,
        },
        process.env.ACTIVATION_SECRET as Secret,
        {
            expiresIn: "10m",
        }
    );
    return { token, activationCode };
}

// activate user
interface IActivationRequest {
    activation_token: string;
    activation_Code: string;
}
// Activate the user
export const activateUser = catchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
        const {activation_token,activation_Code} = req.body as IActivationRequest;
       
        const newUser: {user:Iuser;activationCode: string } = jwt.verify(
            activation_token,
            process.env.ACTIVATION_SECRET as string
        ) as {user:Iuser; activationCode:string};

        // console.log(newUser);

        if(newUser.activationCode !== activation_Code) {
            return next(new ErrorHandler("Invalid activation code",400));
        }

        const {name,email,password} = newUser.user;
        const existUser = await userModel.findOne({email});
        // console.log("existuser",existUser); 
        if(existUser) {
            return next(new ErrorHandler("Email already exist",400));
        }
        const ouruser = await userModel.create({
            name,
            email,
            password
        });
        // console.log("user",ouruser);
        res.status(201).json({
            success: true,
        })
    }catch(e:any) {
        console.log("e",e);
          return next(new ErrorHandler(`activate user:)${e.message}`,400));
          
    }
}
);

interface ILoginRequest {
    email: string,
    password: string,
}

export const loginUser = catchAsyncError(async(req:Request,res:Response,next:NextFunction) => {
    try {
         const {email,password} = req.body as ILoginRequest;

         if(!email || !password) {
            return next(new ErrorHandler("Please enter email and password",400));
         }

         const user = await userModel.findOne({email}).select('+password');

         if(!user) {
            return next(new ErrorHandler('Invalid email or password',400));
         }
         const isPasswordMatch = await user.comparePassword(password);

         if(!isPasswordMatch) {
            return next(new ErrorHandler("Invalid email or password",400));
         }

         sendToken(user,200,res);
    }catch(e:any) {
        return next(new ErrorHandler(e.message,400));
    }
});

export const logoutUser = catchAsyncError(async (req:Request,res:Response,next:NextFunction) => {
      try {
        const userId = req.user?._id || "";
      
        const token = req.headers['authorization']?.split(" ")[1] as string;
      
          res.cookie("access_token","",{maxAge:1});
          res.cookie("redresh_token","",{maxAge:1});
    
          redis.del(userId);
          res.status(200).json({
            success:true,
            message:"Logged out successfully"
          })
      }catch(e:any) {
        return next(new ErrorHandler(`err,${e.message}`,400));
      }
});

// update access token 
export const updateAccessToken = catchAsyncError(async (req:Request,res:Response,next:NextFunction)=> {
    try {
       
         const refreshtoken = res.req.cookies.refresh_token as string;
       
         const decoded = jwt.verify(refreshtoken,process.env.REFRESH_TOKEN as string) as JwtPayload;
       
         const message = 'could not refresh token';
         if(!decoded) {
            return next(new ErrorHandler(message,400));
         }

         const session = await redis.get(decoded.id as string);

         if(!session) {
            return next(new ErrorHandler("user is not yet logged in :(",400));
         }
        const user = JSON.parse(session);

        const refreshed_a_token = jwt.sign({id:user.id},process.env.ACCESS_TOKEN as string,
            {
                expiresIn: "5m"
            }
        )
        const refreshed_r_token = jwt.sign({id:user.id},process.env.REFRESH_TOKEN as string,
            {
                expiresIn: "3d"
            }
        );

        req.user = user;

        res.cookie("access_token",refreshed_a_token,accessTokenOptions);
        res.cookie("refresh_token",refreshed_r_token,refreshTokenOptions);

        await redis.set(user._id, JSON.stringify(user), "EX", 684800);
        res.status(200).json({status:"success",refreshed_a_token});
    } catch (error:any) {
        console.log("err",error);
        return next(new ErrorHandler(`eror,${error.message}`,400));
    }
});

export const getUserInfo = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
       try {
        const userId = req.user?._id as string;
        
        getUserById(userId,res);
       } catch (error:any) {
          return next(new ErrorHandler(`eror,${error.message}`,400));
       }
  }
);

export const SocialAuth = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
        try {
            const {name,email,avatar} = req.body;
             
            if(!email) {
                return next(new ErrorHandler("Email is required",400));
            }
            const user = await userModel.findOne({email});
            if(!user) {
               const newUser = await userModel.create({name,email,avatar});
                sendToken(newUser,200,res);  
                        
            }else {
                sendToken(user,200,res);            
            }
        } catch (error:any) {
            return next(new ErrorHandler(error.message,400));
        }
    });

interface IUpdateUserInfo {
    name?: string;
    email?: string;
}
// Update user Info
export const updateUserInfo = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
        try {
             const {name} = req.body as IUpdateUserInfo;
             const userId = req.user?._id as string;
            
             const user = await userModel.findById(userId);
                 
             if(name && user) {
                user.name = name;
             }
    
             await user?.save();
             await redis.set(userId,JSON.stringify(user));
             return res
             .status(200)
             .json({
                success:true,
                user
             });
        } catch (error:any) {
            return next(new ErrorHandler(`eror,${error.message}`,400));
        }
    }
);

// Update Password
interface IUpdatePassword{
    oldPassword: string;
    newPassword: string;
}

export const updatePassword = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
        try {
            const {oldPassword, newPassword} = req.body as IUpdatePassword;
    
            if(!oldPassword || !newPassword) {
                return next(new ErrorHandler("Old and New Password Both are required",400));
            }

            const user = await userModel.findById(req.user?._id).select("+password");           

            if(user?.password === undefined) { // for socialAuth
                return next(new ErrorHandler("Invalid User",400));
            }
           
            const isPasswordMatch = await user?.comparePassword(oldPassword);
    
            if(!isPasswordMatch) {
                return next(new ErrorHandler("Wrong old Password!!",400));
            }
    
            user.password = newPassword;
            await user.save();
            await redis.set(req.user?._id as string, JSON.stringify(user));
            res
            .status(200)
            .json({
                success: true,
                user
            });
        } catch (error:any) {
            return next(new ErrorHandler(error.message,400));
        }
    }
);

interface IUpdateProfilePicture {
    avatar: string;
}

// Update profile picture
export const UpdateProfilePicture = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
       try {
          const {avatar} = req.body as IUpdateProfilePicture;
 
          const userId = req.user?._id as string;
        
          const user = await userModel.findById(userId);

         if(user && avatar) {
              if(user?.avatar?.public_id) {      
                // first delete it      
                await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
                // then update with new one
                const myCloud = await cloudinary.v2.uploader.upload(avatar,{
                    folder: "avatars",
                    width: 150
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                }
              }else {
                const myCloud = await cloudinary.v2.uploader.upload(avatar,{
                    folder: "avatars",
                    width: 150
                });
                user.avatar = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                }
             }
         } 
        await user?.save();
        await redis.set(userId,JSON.stringify(user))    

        res
        .status(200)
        .json({
            success: true,
            user
        });
       } catch (error:any) {
          return next(new ErrorHandler(error.message,400));
       }
    }
);

// get all users --- only for admin
export const getAllUsers = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
        try {
           return getAllUsersservice(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const updateUserRole = catchAsyncError(
    async(req:Request,res:Response,next:NextFunction) => {
        try {
            const {role,id} = req.body;
            console.log(id);
            console.log("id:",id);
            return updateuserRoleService(res,role,id,next);
        } catch (error:any) {
            return next(new ErrorHandler(error.message, 400));
        }
});

// delete user
export const deleteUser = async (req:Request,res: Response,next:NextFunction) => { 
   try {
    const {id} = req.params;
    const user = await userModel.findById(id);
  
    if(!user) {
        return next(new ErrorHandler("User not found", 400)); 
    }
    await user.deleteOne({id});

    await redis.del(id);
    res
   .status(200)
   .json({
     success: true,
     message: "user deleted successfully"
   });
   } catch (error:any) {
    return next(new ErrorHandler(error.message, 400));
   }
}



