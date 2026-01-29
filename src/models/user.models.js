import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true,
        index : true 
        // optimizes search queries
    },
    email: {
        type: String,
        required: true,
        unique: true,
        unique: true,
        lowercase: true,
        trim : true
    },
    fullname : {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim : true
    },
    avatar : {
        type: String,
        // URL to the user's avatar image
        // here we use the cloudinary url
        required: true
    },
    coverimage : {
        type: String,
        // URL to the user's cover image   
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: 6,
        select: false 
        // prevents password from being returned in queries by default
    },
    watchHistory : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
    },
    refreshToken : {
        type : String
    }
},{timestamps: true});

userSchema.pre("save" , async function(next){
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password , 10);
    next()
})
// always use next to pass the control to next middleware

userSchema.methods.isPasswordMatch = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};
// arguments are entered password and hashed password

userSchema.methods.generateAccessToken = function ()
{
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            name : this.name,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn : process.env.ACCESS_TOKEN_EXPIRATION
        }
    )
}

userSchema.methods.generateRefreshToken = function()
{
    return jwt.sign(
        {
            _id : this._id,
            email : this.email,
            name : this.name,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn : process.env.REFRESH_TOKEN_EXPIRATION
        }
    )
}
const User = mongoose.model("User", userSchema);
export { User };