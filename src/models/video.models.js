import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
const videoSchema = new mongoose.Schema({
    videofile:{
        type: String,
        required : true
    },
    title: {
        type: String,
        required : true,
        trim : true
    },
    duration: {
        type : Number,
        // duration in seconds from cloudinary metadata
        required : true
    },
    description: {
        type : String,
        required : true
    },
    views : {
        type : Number,
        default : 0
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    thumbnail: {
        type: String,
        required : true
    },
    isPublic: {
        type: Boolean,
        default: true
    },
},{timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate);
// Helps us to write paginated aggregate queries

const Video = mongoose.model('Video', videoSchema);
export { Video };