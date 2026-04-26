import express from "express";
import userRouter from "./routes/user.routes.js";
import taskRoutes from "./routes/task.routes.js";

const app = express();

app.use(express.json());

// mount
app.use("/api/users", userRouter);
app.use("/api/tasks", taskRoutes);

export default app;