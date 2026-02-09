import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const VerifyJWT = asyncHandler(async (req, res, next) => {
    //here the token can be in cookies or in headers , in order to remove the token from the cookie,
    //we use the req.cookie , as we gave the request the access of cookie using cookie parser in app.js
    //in headers we use the authorization header and remove the Bearer part from it
    //headers are used when we want to send the token in the request header instead of cookies , 
    //and cookies are used when we want to store the token in the browser and send it with every request automatically
   try
   {
        const token = req.cookies?.AccessToken || req.header('Authorization')?.replace('Bearer ', '')
        // const token =
        //     req.cookies?.AccessToken ||
        //     (req.header("Authorization")?.startsWith("Bearer ")
        //         ? req.header("Authorization").replace("Bearer ", "")
        //         : null);

        //A better way to take the token from the header is to check if the authorization 
        //header starts with Bearer and then remove the Bearer part from it , otherwise return null
        if(!token)
        {
            throw new ApiError('Unauthorized , token not found',401)
        }
        //jwt.verify() method is used to verify the token and decode it , it takes the token and the secret key as parameters
        //if the token is valid , it returns the decoded token , otherwise it throws an error
        //here we are using the ACCESS_TOKEN_SECRET from the environment variables to verify the token ,
        //which is a secret key that we use to sign the token when we generate it
        const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id).select('-password -refreshToken')
        if(!user)
        {
            throw new ApiError('Unauthorized , user not found',401)
        }
        req.user = user
        next()
   } 
   catch (error)
   {
        throw new ApiError(error.message || 'Unauthorized , token not valid' ,401)
   }
})