import mongoose from "mongoose";
import User from "../models/user.model.js";

// GET all users
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        return res.status(200).json(users); // return [] if empty
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

// GET user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Please fill all required field" })
        }
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }
        const user = await User.create({ name, email, password });
        const { password: _, ...safeUser } = user.toObject();

        return res.status(201).json({ message: "Registered successfully", safeUser });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "User already exists" });
        }
        return res.status(500).json({ message: error.message });
    }
}

// Login
export const loginUser = async (req,res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Missing credentials" });
        }

        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            return res.status(401).json({ message: "Email or password is wrong" });
        }

        const { password: _, ...safeUser } = user.toObject();

        return res.status(200).json({
            message: "Login successful",
            user: safeUser
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};


