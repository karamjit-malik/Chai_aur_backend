import {asyncHandler} from "../utils/asyncHandler.js"

const registerUser = asyncHandler(async (req, res) => {
    // Registration logic here
    res.status(201).json({message: "Mast hai bhai"})
})

export {registerUser}