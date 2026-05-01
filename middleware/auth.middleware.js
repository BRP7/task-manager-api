import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";

export const auth = async (req,res,next) => {
    try {
        let token;

        if(req.headers.authorization && req.headers.authorization.startsWith("Bearer ")){
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Auth token missing" });
        }
        
        let decode = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
}

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw apiError("Refresh token required", 401);
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw apiError("Invalid refresh token", 401);
  }

    const user = await userModel.findById(decoded.userId);

    if (!user || user.refreshToken !== refreshToken) {
        throw apiError("Invalid refresh token", 401);
    }

  const newAccessToken = jwt.sign(
    { userId: decoded.userId },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );

  return res.json({ accessToken: newAccessToken });
});
