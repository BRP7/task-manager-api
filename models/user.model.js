import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{
        type : String,
        required : true,
        trim: true,
    },
    email:{
        type:String,
        required : true,
        trim:true,
        lowercase:true,
        unique: true,
    },
    password:{
        type:String,
        required: true,
        minlength:6 
    },
    refreshToken: String
},{timestamps : true})

const User = mongoose.model('User',userSchema); 
export default User;


// password: {
//     type: String,
//     select: false
// }
// Password is NEVER returned unless you explicitly ask for it
// User.findOne({ email }).select("+password")