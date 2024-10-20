require('dotenv').config();
import { Response } from "express";
import { Iuser } from "../models/userModel"
import { redis } from "./redis";

interface ITokenOptions {
    expires: Date;
    maxAge: number;
    httpOnly: boolean;
    samesite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}

const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '300',10);// 5 minutes 
const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '1200',10); // 20 minutes

//options for cookies
export const accessTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + accessTokenExpire*60*60 * 1000),
    maxAge: accessTokenExpire*60*60*1000,
    httpOnly: true,
    samesite: 'lax',
}
export const refreshTokenOptions: ITokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpire * 24*60*60*1000),
    maxAge: refreshTokenExpire*24*60*60*1000,
    httpOnly: true,
    samesite: 'lax',
}

export const sendToken = (user:Iuser,statusCode:number,res:Response) => {
    
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis
    redis.set(user._id.toString(),JSON.stringify(user));

    if(process.env.NODE_ENV === 'production') {
          accessTokenOptions.secure = true;
    }

     res
    .status(statusCode)
    .cookie("access_token",accessToken,accessTokenOptions)
    .cookie("refresh_token", refreshToken, refreshTokenOptions);

    // console.log("res after login", res.req.cookies);
    return res.json({
        success: true,
        user,
        accessToken,
    });
} 