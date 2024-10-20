import {Redis} from "ioredis"
require("dotenv").config();

// EStablishing the connection with reddis server
const redisClient = () => {
    if(process.env.REDIS_URL) {
        console.log("Reddis connected");
        return process.env.REDIS_URL;
    }
    throw new Error("Reddis connection failed");    
}

export const redis = new Redis(redisClient());