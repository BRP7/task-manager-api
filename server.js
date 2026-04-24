import app from "./app.js";
import connectDB from "./config/db.js"; //In ES modules you MUST include .js
import dotenv from "dotenv"


dotenv.config();

const PORT = process.env.PORT || 3000;
const startServer = async () => {
    await connectDB(); //Top-level await only work if "type": "module" is set in package.json without async function
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

startServer();