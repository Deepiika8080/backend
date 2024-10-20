import mongoose,{Model,Document,Schema} from "mongoose";
import { Iuser } from "./userModel";

interface IComment extends Document {
    user:Iuser,
    question: string,
    questionReplies: IComment[];
}

interface IReview extends Document {
    user: Iuser,
    rating: number,
    comment: string,
    commentReplies?: IComment[];
}

interface ILink extends Document {
    title: string,
    url: string,
}

interface ICourseData extends Document {
    title: string,
    description: string,
    videoUrl: string,
    videoThumbnail: object,
    videoSection: string,
    videoPlayer:string,
    videoLength: number
    links:ILink[],
    suggestion: string,
    question:IComment[];    
}

interface ICourse extends Document {
    name: string,
    description: string,
    price: number,
    estimatedPrice?: number,
    thumbnail: string,
    tags: string,
    level:string,
    demourl: string,
    benefits: {title: string}[];
    purchased?: number,
    ratings?:number;
    prerequisites:{title: string}[];
    reviews:[IReview],
    courseData:[ICourseData]
}
const reviewSchema = new Schema<IReview>({
    user: Object,
    rating:{
        type:Number,
        default:0
    },
    comment: String,
    commentReplies: [Object]
});

const linkSchema = new Schema<ILink>({
    title: String,
    url: String
});

const commentSchema = new Schema<IComment> ({
    user: Object,
    question: String,
    questionReplies: [Object]
});

const courseDataSchema = new Schema<ICourseData>({
    videoUrl: String,   
    title: String,
    description: String,
    videoLength: Number,
    videoPlayer: String,
    videoSection: String,
    links: [linkSchema],
    suggestion: String,
    question: [commentSchema],
});

const courseSchema = new Schema<ICourse>({
    name: {
      type: String,
      required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    estimatedPrice: {
        type: Number,
    },
    thumbnail: {
        public_id: {
           
            type: String,
        },
        url: {
            
            type: String, 
        }
    },
    tags: {
        required: true,
        type: String, 
    },
    level: {
        required: true,
        type: String, 
    },
    demourl: {
        required: true,
        type: String, 
    },
    benefits: [{title:String}],
    prerequisites: [{title:String}],
    reviews: [reviewSchema],
    courseData: [courseDataSchema],
    ratings: {
        type: Number,
        default: 0,
    },
    purchased: {
        type: Number,
        default: 0,
    },
},{ timestamps: true}
);

const courseModel: Model<ICourse> = mongoose.model("Course",courseSchema);

export default courseModel;