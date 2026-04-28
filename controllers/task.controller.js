import mongoose from "mongoose";
import Task from "../models/task.model.js";

// safer date (no timezone bugs)
const getToday = () => {
    const now = new Date();
    return new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    ).toISOString().split("T")[0];
};


export const createTask = async (req, res) => {
    try {
        const { title, type, estimatedTime } = req.body;
        const userId = req.user.userId;

        const time = Number(estimatedTime);

        // validation
        if (!title || !type || isNaN(time) || time <= 0) {
            return res.status(400).json({
                message: "Title, type and estimatedTime are required"
            });
        }

        if (!["primary", "secondary"].includes(type)) {
            return res.status(400).json({ message: "Invalid task type" });
        }

        const today = getToday();

        const tasks = await Task.find({ user: userId, date: today });

        const primaryTask = tasks.find(t => t.type === "primary");
        const secondaryTasks = tasks.filter(t => t.type === "secondary");

        // PRIMARY RULE
        if (type === "primary") {
            if (primaryTask) {
                return res.status(409).json({
                    message: "Primary task already exists"
                });
            }
        }

        // SECONDARY RULE
        if (type === "secondary") {

            if (!primaryTask) {
                return res.status(400).json({
                    message: "Create primary task first"
                });
            }

            if (primaryTask.status !== "done") {
                if (secondaryTasks.length >= 2) {
                    return res.status(400).json({
                        message: "Max 2 secondary tasks before primary is done"
                    });
                }
            } else {
                if (secondaryTasks.length >= 5) {
                    return res.status(400).json({
                        message: "Max 5 secondary tasks after primary is done"
                    });
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

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const updateTaskStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;
        const userId = req.user.userId;

        const allowedStatus = ["todo", "in-progress", "done"];

        if (!status || !allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        const task = await Task.findOne({ _id: id, user: userId });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        if (task.status === status) {
            return res.status(409).json({
                message: "Task already has this status"
            });
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
                    return res.status(400).json({
                        message: "Finish primary task first"
                    });
                }
            }

            // only 1 active task
            const activeTask = await Task.findOne({
                user: userId,
                date: task.date,
                status: "in-progress"
            });

            if (activeTask && !activeTask._id.equals(task._id)) {
                return res.status(400).json({
                    message: "Another task is already in progress"
                });
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

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const getTasks = async (req, res) => {
    try {
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

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const renameTask = async (req, res) => {
    try {
        const { id } = req.params;
        const { rename } = req.body;
        const userId = req.user.userId;

        // validate id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid ID" });
        }

        // validate input
        if (!rename || !rename.trim()) {
            return res.status(400).json({
                message: "Valid title required"
            });
        }

        // get task
        const task = await Task.findOne({
            _id: id,
            user: userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // rule: cannot rename after its done
        if (task.status === "done") {
            return res.status(400).json({
                message: "Cannot rename completed task"
            });
        }

        // update
        task.title = rename.trim();
        await task.save();

        return res.status(200).json(task);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};

export const carryForwardedTask = async (req, res) => {
    try {
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
            return res.status(404).json({
                message: "No task to carry forward"
            });
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
            return res.status(400).json({
                message: "No primary task available for tomorrow",
                action: "select_primary"
            });
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

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};

export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;

        // validate id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid ID"
            });
        }

        // find task
        const task = await Task.findOne({
            _id: id,
            user: userId
        });

        if (!task) {
            return res.status(404).json({
                message: "Task not found"
            });
        }

        // block primary deletion
        if (task.type === "primary") {
            return res.status(400).json({
                message: "Primary task cannot be deleted"
            });
        }

        // delete secondary
        await Task.deleteOne({ _id: id });

        return res.status(200).json({
            message: "Task deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: error.message
        });
    }
};