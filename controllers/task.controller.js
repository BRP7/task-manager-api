import Task from "../models/task.model.js";

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

        const today = new Date().toISOString().split("T")[0];
        const tasks = await Task.find({ user: userId, date: today });

        const primaryTask = tasks.find(t => t.type === "primary");
        const secondaryTasks = tasks.filter(t => t.type === "secondary");

        if (type === "primary") {
            if (primaryTask) {
                return res.status(409).json({
                    message: "Primary task already exists"
                });
            }
        }

        if (type === "secondary") {

            if (!primaryTask) {
                return res.status(400).json({
                    message: "Create primary task first"
                });
            }

            if (primaryTask && primaryTask.status !== "done") {
                if (secondaryTasks.length >= 2) {
                    return res.status(400).json({
                        message: "Cannot create more than 2 secondary tasks"
                    });
                }
            } else {
                if (secondaryTasks.length >= 5) {
                    return res.status(400).json({
                        message: "Cannot create more than 5 secondary tasks"
                    });
                }
            }
        }

        const task = await Task.create({
            title,
            type,
            estimatedTime,
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

        // validate
        if (!status || !allowedStatus.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        // get task
        const task = await Task.findOne({ user: userId, _id: id });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // prevent same status
        if (task.status === status) {
            return res.status(409).json({
                message: "Task already has this status"
            });
        }

        if (status === "in-progress") {

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

        // update
        task.status = status;
        await task.save();

        return res.status(200).json(task);

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};