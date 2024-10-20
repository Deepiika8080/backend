require('dotenv').config();
import mongoose, { Document, Schema ,Model} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const emailRegexPattern : RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface Iuser extends Document{
    _id:string,
    name:string,
    email:string,
    password:string,
    avatar: {
       public_id: string,
       url: string,
    },
    role:string,// student or admin
    isverified:boolean,
    courses: Array<{courseId:string}>;
    comparePassword: (password:string) => Promise<boolean>;
    SignAccessToken: () => string;
    SignRefreshToken: () => string;
};

const userSchema: Schema<Iuser> = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "name is reqiured"],
        minlength:3,
        maxlength:20
    },
    email: {
        type: String,
        required: [true,"email is required "],
        validate: {
            validator: function (value:string) {
                return emailRegexPattern.test(value);
            },
            message:"Enter a valid email",
        },
        unique:true
    },
    password: {
        type: String,        
        minlength:[6, "Password must be at least 6 characters "],
        maxlength:[15, "Password length shouldn't exceed 15 characters "],
        select:false
    },
    avatar: {
          public_id:String,
          url:String
    },
    role: {
        type: String,
        default:"user"
    },
    isverified: {
        type: Boolean,
        default:false,
    },
    courses: [
        {
            courseId: String
        }
    ],
},
 { timestamps: true}
);

// Hash password before saving it
userSchema.pre<Iuser>('save',async function(next) {
    if(!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hash(this.password,10);
    next();
})

// sign Access Token
userSchema.methods.SignAccessToken = function () {
    return jwt.sign({id: this._id},process.env.ACCESS_TOKEN || '',{
        expiresIn:"5m"
    });
}

// sign refresh token 
userSchema.methods.SignRefreshToken = function () {
    return jwt.sign({id: this._id},process.env.REFRESH_TOKEN || '');
}
// compare password
userSchema.methods.comparePassword = async function(enteredPassword:string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword,this.password);
}

const userModel: Model<Iuser> = mongoose.model("User",userSchema);
export default userModel;