import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(async (req, res) => {
    //validation for not empty fields
    //user already exists check
    //check for images , avatar
    //upload images to cloudinary
    //remove refersh token and password from req.body   
    const {fullname, email, username , password} = req.body
    if(fullname ==='' || email === '' || username === '' || password === '')
    {
        throw new ApiError("All fields are required", 400)
    }
    const existingUser = await User.findOne({
        $or: [
            { email: email },
            { username: username }
        ]
    })
    if(existingUser)
    {
        throw new ApiError('User already exists with this email or username', 409)
    }
    console.log("Files received in registerUser:", req.files);
    const avatarLocalPath = req.files?.avatar[0]?.path
    // const coverImageLocalPath = req.files?.coverImage[0]?.path
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
    if(!avatarLocalPath)
    {
        throw new ApiError("Avatar is required", 400)
    }
    const avatarUploadResult = await uploadToCloudinary(avatarLocalPath, 'avatars')
    const coverImageUploadResult = await uploadToCloudinary(coverImageLocalPath, 'coverImages')
    if(!avatarUploadResult)
    {
        throw new ApiError("Image upload failed", 500)
    }
    const newUser = await User.create({
        fullname,
        email,
        username : username.toLowerCase(),
        password,
        avatar: avatarUploadResult.url,
        coverImage: coverImageUploadResult?.url || ""  
    })
    const createdUser = await User.findById(newUser._id).select("-password -refreshToken")
    if(!createdUser)
    {
        throw new ApiError("User creation failed", 500)
    }
    res.status(201).json(
        new ApiResponse(createdUser, "User registered successfully", 201)
    )
})

const generateAccessandRefreshToken = async (userId) =>
{
    try
    {
        const user = await User.findById(userId)
        const AccessToken = user.generateAccessToken()
        const RefreshToken = user.generateRefreshToken()
        console.log("ACCESS SECRET:", process.env.ACCESS_TOKEN_SECRET);
        console.log("REFRESH SECRET:", process.env.REFRESH_TOKEN_SECRET);

        user.refreshToken = RefreshToken
        // validateBeforeSave ko false karne se password hashing aur dusre pre save hooks skip ho jayenge
        // kyunki yahan par hume password update nahi karna hai , sirf refresh token update karna hai
        await user.save({validateBeforeSave : false})
        return {AccessToken, RefreshToken}
        // save karne se refersh token database me store ho jayega , 
        // aur hum usko future me verify kar sakte hai jab user refresh token ke through new access token mangta hai
        //abhi retuen kar do taki client ko token mil jaye , aur response bhej do
    }
    catch(err)
    {
        console.log("TOKEN ERROR:", err);
        throw new ApiError("Token generation failed", 500)
    }
}
const loginUser = asyncHandler(async (req, res)=>
{
    //req.body se data retrieve karo
    //email aur username ke basis par user find karo
    //password verify karo
    //access and refresh token generate karo
    //send cookies and response
    const {email , username , password} = req.body;
    if(!email && !username)
    {
        throw new ApiError('Email or Username is required',400)
    }
    const exists = await User.findOne({
        $or : [ {email : email} , {username : username} ]
    }).select("+password +refreshToken") //yahan par +password isliye kiya hai kyunki by default password select nahi hota hai user model me
    if(!exists)
    {
        throw new ApiError('User not found with this email or username',404)
    }
    //password match karne ke liye user model me method banaya hai , isPasswordMatch
    //yahan par database wala user se password match karna hai , isliye exists.isPasswordMatch() use karenge
    const isPasswordCorrect = await exists.isPasswordMatch(password)
    if(!isPasswordCorrect)
    {
        throw new ApiError('Invalid credentials',401)
    }
    const loggedInUser = await User.findById(exists._id).select("-password -refreshToken")
    // loggedInUser ko select karne ke baad token generate karna hai , taki token me password aur refresh token na jaye
    //ye unwanted fields token me nahi jayenge , aur security badhegi
    const {AccessToken, RefreshToken} = await generateAccessandRefreshToken(loggedInUser._id)
    //use of options is to set the cookie options like httpOnly and secure
    //httpOnly option is used to prevent client side scripts from accessing the cookie , which is important for security
    const options = {
        httpOnly : true,
        secure : true
    }
    //cookie is a small piece of data that server sends to the client and client stores it and sends it back to the server with every request
    //yahan par hum access token aur refresh token ko cookie me store kar rahe hai , taki client side me unko access karna easy ho jaye
    return res
    .status(200)
    .cookie("AccessToken", AccessToken, options)
    .cookie("RefreshToken", RefreshToken, options)
    .json(
        new ApiResponse(
            {
                user : loggedInUser,
                AccessToken,
                RefreshToken
            },
            "User logged in successfully",
            200
        )
    )
})

const logoutUser = asyncHandler(async (req, res) => 
{
    //logout karne ke liye hume user ke refresh token ko null karna hai , taki wo token future me use na ho sake
    //aur cookies ko clear karna hai
    const userId = req.user._id
    await User.findByIdAndUpdate(
        userId , 
        {$set : 
            {refreshToken : undefined}
        },
        {
            new : true
    })
    const options = {
        httpOnly : true,
        secure : true
    }
    return res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie('RefreshToken', options)
    .json(
        new ApiResponse({}, "User logged out successfully", 200)
    )
})

const refreshAccessToken = asyncHandler(async (req, res) =>
{
    //refresh token ke basis par new access token generate karna hai
    //refresh token ko verify karna hai , aur database me stored refresh token se match karna hai
    //agar valid hai to new access token generate karke send karna hai
    const incommingRefreshToken = req.cookies.RefreshToken || req.body.RefreshToken || req.headers['x-refresh-token']
    if(!incommingRefreshToken)
    {
        throw new ApiError("Refresh token is missing", 401)
    }
    try
    {
        const decoded = jwt.verify(incommingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        if(!decoded || !decoded._id)
        {
            throw new ApiError("Invalid refresh token", 401)
        }  
        const userId = decoded._id
        const user = await User.findById(userId).select("+refreshToken")
        if(incommingRefreshToken !== user.refreshToken)
        {
            throw new ApiError("Refresh token does not match", 401)
        }
        const options = {
            httpOnly : true,
            secure : true
        }
        const {access , refresh} = await generateAccessandRefreshToken(userId)
        return res
        .status(200)
        .cookie("AccessToken" , access , options)
        .cookie("RefreshToken" , refresh , options)
        .json(
            new ApiResponse(
                {
                    AccessToken : access,
                    RefreshToken : refresh
                },
                "Refresh token generated successfully",
                200
            )
        )
    }
    catch (error) 
    {
        throw new ApiError(error.message || "Failed to refresh access token", 500)
    }
})
export {registerUser, loginUser , logoutUser , refreshAccessToken}