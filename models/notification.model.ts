import mongoose,{Document,Model,Schema} from "mongoose";

export interface INotification extends Document{
     message: string,
     title:string,
     status:string,
     userId:string,
}

const notificationSchema = new Schema<INotification>({
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true,
        default: "un read"
    }
},{timestamps: true});

const NotificationModel: Model<INotification> = mongoose.model('Notification',notificationSchema);

export default NotificationModel;