import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { generateAccessAndRefereshTokens } from "./token.controllers.js";
import jwt from "jsonwebtoken";


// Register User Controller

const registerUser = asyncHandler( async(req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
//------------------------------------------------------------------------

    // get user details from frontend
    const {fullName, email, password} = req.body
    console.log("email: ", email);

    // validation - not empty
    if (
        [fullName, email, password].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "All field are required")
    }

    // check if user already exists: username, email
    const existeduser = await User.findOne({
        $or: [{ email }]

    })

    if (existeduser) {
        throw new ApiError(409, "User with email or username already exists")
    }
/*
    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    console.log(avatar)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar on cloud file is required")  
    }
*/
    // check for user creation
    const user = await User.create({
        fullName,        
        email,
        password,
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser){
        throw new ApiError(500, "Something went wrong while registring the user")
    }

    // return res
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )

} ) 
 
// login User Controller

const loginUser = asyncHandler(async (req, res) => {


    // get user details from frontend
    const { email, password} = req.body
    console.log(email);
    
    // validation - not empty
    if (!email) {
        throw new ApiError(400, "username or email is required for login")
    }

    // check if user exists: username, email
    const user = await User.findOne({
        $or: [{email}]

    }) 
    

    if (!user) {
        throw new ApiError(404, "User does not exist")
        
    }

    // check for password
    const isPasswordVaild = await user.isPasswordCorrect(password)

    if (!isPasswordVaild) {
        throw new ApiError(401, "Invalid user credentials")        
    }

    // create access token and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findById(user._id)
    .select("-password -refreshtoken")

    const options = {
        httpOnly: true,
        secure: true
    }

    // return res
    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200, {
            user: loggedInUser, accessToken, refreshToken
        }, "User logged In Successfully"
    ))   
})

// logout User Controller

const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken:  "" // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})






export { 
   registerUser ,
   loginUser,
   logoutUser,
}