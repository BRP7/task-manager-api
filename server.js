import app from "./app.js";
import connectDB from "./config/db.js"; //In ES modules you MUST include .js

const startServer = async () => {
    await connectDB(); //Top-level await only work if "type": "module" is set in package.json 
    app.listen(3000,()=>{
        console.log("Server running at 3000");
    });
}

startServer();