import bcrypt from "bcrypt";
import userModel from "../models/user.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const getUsers = asyncHandler(async (req, res) => {
    const users = await userModel.find().select("-password");
    return res.status(200).json(users);
});

export const getUserById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw apiError("Missing or Invalid ID", 400);
    }

    const user = await userModel.findById(id).select("-password");

    if (!user) {
        throw apiError("User not found", 404);
    }

    return res.status(200).json(user);
});

export const registerUser = asyncHandler(async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            throw apiError("Fill all the fields", 400);
        }

        const existingUser = await userModel.findOne({ email });

        if (existingUser) {
            throw apiError("User already exists", 409);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await userModel.create({ name, email, password: hashedPassword });
        const { password: _, ...secureUser } = user.toObject();

        return res.status(201).json({
            message: "User registered successfully",
            user: secureUser
        });
    } catch (error) {
        if (error.code === 11000) {
            throw apiError("User already exists", 409);
        }

        throw error;
    }
});

export const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw apiError("Missing credentials", 400);
    }

    const user = await userModel.findOne({ email });

    if (!user) {
        throw apiError("Email or Password is invalid", 401);
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        throw apiError("Email or Password is invalid", 401);
    }

    const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: "7d" }
    );
    user.refreshToken = refreshToken;
    await user.save();
    const { password: _, ...secureUser } = user.toObject();

    return res.status(200).json({
        message: "Login successful",
        user: secureUser,
        token,
        refreshToken
    });
});

export const getProfile = asyncHandler(async (req, res) => {
    const user = await userModel.findById(req.user.userId).select("-password");

    if (!user) {
        throw apiError("User not found", 404);
    }

    return res.status(200).json(user);
});

export const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  await userModel.findByIdAndUpdate(userId, {
    refreshToken: null
  });

  return res.status(200).json({
    message: "Logged out successfully"
  });
});