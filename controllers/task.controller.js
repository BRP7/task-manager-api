import mongoose from "mongoose";
import Task from "../models/task.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js"

// safer date (no timezone bugs)
const getToday = () => {
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    ).toISOString().split("T")[0];
};


export const createTask = asyncHandler (async (req, res) => {
        const { title, type, estimatedTime } = req.body;
        const userId = req.user.userId;

        const time = Number(estimatedTime);

        // validation
        if (!title || !type || isNaN(time) || time <= 0) {
            throw apiError("Title, type and estimatedTime are required",400);
        }

        if (!["primary", "secondary"].includes(type)) {
            throw apiError("Invalid task type",400);
        }

        const today = getToday();

        const tasks = await Task.find({ user: userId, date: today });

        const primaryTask = tasks.find(t => t.type === "primary");
        const secondaryTasks = tasks.filter(t => t.type === "secondary");

        // PRIMARY RULE
        if (type === "primary") {
            if (primaryTask) {
                throw apiError("Primary task already exists", 409);
            }
        }

        // SECONDARY RULE
        if (type === "secondary") {

            if (!primaryTask) {
                throw apiError("Create primary task first", 400);
            }

            if (primaryTask.status !== "done") {
                if (secondaryTasks.length >= 2) {
                    throw apiError("Max 2 secondary tasks before primary is done", 400);
                }
            } else {
                if (secondaryTasks.length >= 5) {
                    throw apiError("Max 5 secondary tasks after primary is done", 400);
                }
            }
        }

        const task = await Task.create({
            title,
            type,
            estimatedTime: time,
            date: today,
            user: userId
        });

        return res.status(201).json(task);
});

export const updateTaskStatus = asyncHandler (async (req, res) => {
        const { status } = req.body;
        const { id } = req.params;
        const userId = req.user.userId;

        const allowedStatus = ["todo", "in-progress", "done"];

        if (!status || !allowedStatus.includes(status)) {
            throw apiError("Invalid status", 400);
        }

        const task = await Task.findOne({ _id: id, user: userId });

        if (!task) {
            throw apiError("Task not found", 404);
        }

        if (task.status === status) {
            throw apiError("Task already has this status", 409);
        }

        if (status === "in-progress") {

            // secondary cannot start before primary done
            if (task.type === "secondary") {
                const primary = await Task.findOne({
                    user: userId,
                    date: task.date,
                    type: "primary"
                });

                if (!primary || primary.status !== "done") {
                    throw apiError("Finish primary task first", 400);
                }
            }

            // only 1 active task
            const activeTask = await Task.findOne({
                user: userId,
                date: task.date,
                status: "in-progress"
            });

            if (activeTask && !activeTask._id.equals(task._id)) {
                throw apiError("Another task is already in progress", 400);
            }

            task.startedAt = new Date();
        }

        if (status === "done" || status === "todo") {

            if (task.startedAt) {
                const now = new Date();
                const diff = Math.floor((now - task.startedAt) / 60000);

                task.actualTime += diff;
                task.startedAt = null;
            }
        }

        task.status = status;
        await task.save();

        return res.status(200).json(task);


});

export const getTasks = asyncHandler (async (req, res) => {

        const userId = req.user.userId;
        const today = getToday();

        const tasks = await Task.find({ user: userId, date: today })
            .sort({ createdAt: 1 });

        const primary = tasks.find(t => t.type === "primary") || null;
        const secondary = tasks.filter(t => t.type === "secondary");

        return res.status(200).json({
            primary,
            secondary
        });


});

export const renameTask = asyncHandler (async (req, res) => {

        const { id } = req.params;
        const { rename } = req.body;
        const userId = req.user.userId;

        // validate id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            throw apiError("Invalid ID", 400);
        }

        // validate input
        if (!rename || !rename.trim()) {
            throw apiError("Valid title required", 400);
        }

        // get task
        const task = await Task.findOne({
            _id: id,
            user: userId
        });

        if (!task) {
            throw apiError("Task not found", 404);
        }

        // rule: cannot rename after its done
        if (task.status === "done") {
            throw apiError("Cannot rename completed task", 400);
        }

        // update
        task.title = rename.trim();
        await task.save();

        return res.status(200).json(task);


});

export const carryForwardedTask = asyncHandler (async (req, res) => {

        const { ids } = req.body;
        const userId = req.user.userId;

        const query = {
            user: userId,
            date: getToday(),
            status: { $ne: "done" }
        };

        if (ids && ids.length) {
            query._id = { $in: ids };
        }

        const tasks = await Task.find(query);

        if (!tasks.length) {
            throw apiError("No task to carry forward", 404);
        }

        const base = new Date();
        base.setDate(base.getDate() + 1);

        const tomorrow = new Date(
            base.getFullYear(),
            base.getMonth(),
            base.getDate()
        ).toISOString().split("T")[0];

        const tomorrowsTasks = await Task.find({
            user: userId,
            date: tomorrow
        });

        const primaryTomorrow = tomorrowsTasks.find(t => t.type === "primary") || null;
        const secondaryTomorrow = tomorrowsTasks.filter(t => t.type === "secondary");

        const primaryToday = tasks.find(t => t.type === "primary") || null;

        if (!primaryTomorrow && !primaryToday) {
            throw apiError("No primary task available for tomorrow", 400);
        }

        const secondaryLimit = primaryTomorrow && primaryTomorrow.status === "done" ? 5 : 2;

        let newTasks = [];

        for (let t of tasks) {

            // PRIMARY
            if (t.type === "primary") {
                if (primaryTomorrow || newTasks.some(nt => nt.type === "primary")) {
                    continue;
                }
            }

            // SECONDARY
            if (t.type === "secondary") {
                const totalSecondary =
                    secondaryTomorrow.length +
                    newTasks.filter(nt => nt.type === "secondary").length;

                if (totalSecondary >= secondaryLimit) {
                    continue;
                }
            }

            newTasks.push({
                title: t.title,
                status: "todo",
                type: t.type,
                date: tomorrow,
                user: userId,
                estimatedTime: t.estimatedTime
            });
        }

        const createdTasks = await Task.insertMany(newTasks);

        return res.status(201).json({
            message: "Tasks carried forward successfully",
            count: createdTasks.length,
            tasks: createdTasks
        });
});

export const deleteTask = asyncHandler (async (req, res) => {

     const { id } = req.params;
     const userId = req.user.userId;
 
     // validate id
     if (!mongoose.Types.ObjectId.isValid(id)) {
         throw apiError("Invalid ID", 400);
     }
 
     const deleted = await Task.deleteOne({
         _id: id,
         user: userId,
         type: "secondary"
     });
 
     if (deleted.deletedCount === 0) {
         throw apiError("Task not found or not allowed", 404);
     }

     return res.status(200).json({
            message: "Task deleted successfully"
        });
   
})
