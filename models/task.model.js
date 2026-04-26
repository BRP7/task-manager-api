import mongoose from "mongoose";

const taskSchema = new mongoose.Schema({
    title : { type : String , required : true , trim: true },
    type : {
        type : String,
        enum : ["primary","secondary"],
        required : true
    },
    status:{
        type : String,
        enum : ["todo","in-progress","done"],
        default: "todo"
    },
    estimatedTime : Number, //In minute
    actualTime:{
        type : Number,
        default : 0,
        min : 0 
    },
    startedAt : Date,
    date : {
        type :String, // "YYYY-MM-DD"
        required : true
    },
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User",
        required: true
    }
},{timestamps : true});
// fast lookup for daily tasks
taskSchema.index({ user: 1, date: 1 });
const Task = mongoose.model("Task",taskSchema);
export default Task;