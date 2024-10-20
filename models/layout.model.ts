import { Schema,model,Document } from "mongoose";

interface FaqItem extends Document {
    question: string;
    answer: string;
}

interface Catagory extends Document {
    title: string;
}

interface BannerImage extends Document {
    public_id: string;
    url: string;
}

interface Layout extends Document {
    type: string;
    faq: FaqItem[];
    catagories: Catagory[];
    banner: {
        image: BannerImage;
        title: string;
        subTitle: string;
    }
}

const faqSchema = new Schema<FaqItem> ({
    question: { type: String , required: true},
    answer: {type: String , required: true}
});

const catagorySchema = new Schema<Catagory> ({
    title: { type: String , required: true }
});

const bannerImageSchema = new Schema<BannerImage> ({
    public_id: { type: String , required: true  },
    url:{ type: String , required: true }
});

const layoutSchema = new Schema<Layout> ({
    type: { type: String, required: true },
    faq: [faqSchema],
    catagories: [catagorySchema],
    banner: {
        image: bannerImageSchema,
        title: { type: String },
        subTitle: { type: String},
    }
});

const layoutModel = model<Layout>('Layout',layoutSchema);

export default layoutModel;


