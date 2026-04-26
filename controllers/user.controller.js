import bcrypt from "bcrypt"
import userModel from "../models/user.model.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

export const getUsers = async (req,res) => {
    try {
        const users = await userModel.find().select("-password");
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({message : error.message})
    }
}

export const getUserById = async (req,res) => {
    try {
        const { id } = req.params;
        if(!id || !mongoose.Types.ObjectId.isValid(id)){
            return res.status(400).json({message : "Missing or Invalid ID"})
        }
        const user = await userModel.findById(id).select("-password"); // find by Id just want ID Not object {id}
        if(!user){
            return res.status(404).json({message : "User not found"})
        }
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({message : error.message})
    }
}

export const registerUser = async (req,res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Fill all the fields" })
        }

        const existingUser  = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });//send number in status not string ("409")
        }
        const hashedPassword = await bcrypt.hash(password , 10);

        const user = await userModel.create({ name, email, password:hashedPassword });
        const { password:_ , ...secureUser} = user.toObject();

        return res.status(201).json({ message: "User registered successfully" , user: secureUser })
    } catch (error) {

          if (error.code === 11000) {
            return res.status(409).json({ message: "User already exists" }); //Your pre-check FAILED to protect you //Check and insert are NOT one single operation Two users (or same user double-click) hit register:
        }
        return res.status(500).json({ message: error.message })
    }
}

export const loginUser = async (req,res) => {
    try {
        const { email , password } = req.body;
        if(!email || !password){
            return res.status(400).json({message : "Missing credentials"})
        }
        const user = await userModel.findOne({email});

        if(!user){
            return res.status(401).json({ message: "Email or Password is invalid" }); // authentication fail must be 401 not 404
        }

        const isValid = await bcrypt.compare(password, user.password); //await needed for compare 
        if(!isValid){
            return res.status(401).json({ message: "Email or Password is invalid" });
        }

        const token = jwt.sign(
            {userId : user._id},
            process.env.JWT_SECRET,
            {expiresIn : process.env.JWT_EXPIRES_IN}
        )

        const { password:_ , ...secureUser } = user.toObject();

        return res.status(200).json({message : "Login successful", user : secureUser , token})
    } catch (error) {
        return res.status(500).json({message : error.message});
    }
}

export const getProfile = async (req, res) => {
    try {
        // if (!mongoose.Types.ObjectId.isValid(id)) {
        //     return res.status(400).json({ message: "Invalid ID" });
        // } //You should NOT take id from request Client can fake it u are taking id which already stored in JWT so no need to validate mongoose valid id here if user sending it then u can do that but here we are not taking it from user  ❌ 2. Profile route is NOT based on user input Profile = logged-in user NOT "user you ask for"

        const user = await userModel.findById(req.user.userId).select("-password"); //not req.id but req.user.userId the name via we store it while login in jwt we added in user so user.userId

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({message : error.message});
    }
}
