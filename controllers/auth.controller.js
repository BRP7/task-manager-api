import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt"

export const registerUser = asyncHandler( async (req,res) => {
    const { name , email , password } = req.body;
    if(!name || !email || !password){
        throw apiError("Please Fill all the fields",400);
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if(user){
        throw apiError("User already exist",409);
    }

    const hashedPassword = await bcrypt.hash(password,10);
    const newUser = await User.create({
        name,
        email : normalizedEmail,
        password : hashedPassword
    })

    const { password: _, ...safeUser } = newUser.toObject(); //Mongoose document ≠ plain JS object

    res.status(201).json({message : "User Register Successfully", user : safeUser })

});

export const loginUser = asyncHandler ( async (req,res) => {
    const { email , password } = req.body;
    if(!email || !password){
        throw apiError("Please fill all the fields",400);
    }

    if (password.length < 6) {
        throw apiError("Password must be at least 6 characters", 400);
    }

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if(!user){
        throw apiError("Email or Password is invalid",401);
    }

    const isValid = await bcrypt.compare(password,user.password);
    if(!isValid){
        throw apiError("Email or Password is invalid",401);
    }

    const accessToken = jwt.sign(
        {"userId" : user._id},
        process.env.JWT_SECRET,
        {expiresIn : process.env.JWT_EXPIRES_IN}
    );

    const refreshToken = jwt.sign(
        {userId : user._id},
        process.env.JWT_REFRESH_SECRET,
        { expiresIn : "7d"}
    )

    user.refreshToken = refreshToken;
    await user.save();
    const {password: _ , ...secureUser } = user.toObject();
    return res.status(200).json({message : "login successful", token : accessToken, refreshToken , user: secureUser})
});

export const logoutUser = asyncHandler ( async (req,res) => {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if(!user){
        throw apiError("User not found",404);
    }

    user.refreshToken = null;
    await user.save();
    return res.status(200).json({message : "logout successfully"})
});

export const refreshAccessToken = asyncHandler ( async (req,res)=>{
    const { refreshToken } = req.body;

    if(!refreshToken){
        throw apiError("missing token",401);
    }

    let decode;
    
    try {
        decode = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (error) {
        throw apiError("Invalid or expired refresh token", 401);
    }

    const user = await User.findById(decode.userId);

    if(!user || user.refreshToken !== refreshToken){
        throw apiError("invalid token",400);
    }

    const newAccessToken = jwt.sign(
        {userId:user._id},
        process.env.JWT_SECRET,
        {expiresIn: process.env.JWT_EXPIRES_IN}
    );

    return res.status(200).json({message : "token generated", token : newAccessToken})
});