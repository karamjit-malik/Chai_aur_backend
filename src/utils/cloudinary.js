import {v2 as cloudinary} from 'cloudinary'
import fs from 'fs'
 cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

const uploadToCloudinary= async (filePath)=>{
    try {
        const result= await cloudinary.uploader.upload(filePath, {resource_type: "auto"});
        console.log("Cloudinary Upload Result:", result.url);
        // fs.unlinkSync(filePath);
        return result;
    }
    catch (error) {
        console.error("Cloudinary Upload Error:", error);
        throw error;
    }
    finally
    {
        // console.log("Deleting:", filePath);
        // fs.unlinkSync(filePath);
    }

}

export {uploadToCloudinary};