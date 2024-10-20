import mongoose from "mongoose";
require("dotenv").config();

const dbUrl:string = process.env.DB_URL || '';

// EStablishing the connection with db
export const connectDB = async () => {
   try {
    await mongoose.connect(dbUrl).then((data:any) => {
        console.log(`Database is connected successfully ${data.connection.host}:)`);
    });
   }catch(e:any) {
    console.log("There was an error in connecting the database :)",e.message);
    setTimeout(connectDB,5000);
   }
}

