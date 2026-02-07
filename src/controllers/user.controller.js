import {asyncHandler} from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadToCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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

export {registerUser}