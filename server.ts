import { app } from "./app";
require('dotenv').config();
import { connectDB } from "./utils/db";
import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET_key
})
// create server
app.listen(process.env.PORT,async () => {
    console.log(`Server is Listening to ${process.env.PORT}`);
    await connectDB();
});
