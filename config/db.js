import mongoose from "mongoose";

const connectDB = async () =>{
    try{
        await mongoose.connect("mongodb://127.0.0.1:27017/myapp");
        console.log("DB connected");
    }catch(err){
        console.error("DB connection failed:", err.message);
        process.exit(1);
    }
}

export default connectDB;