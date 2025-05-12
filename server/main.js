const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const config = require("./config/config");
const connectDB = require("./config/database");
const errorHandler = require("./middleware/errorHandler");
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const authMiddleware = require("./middleware/auth");
const { connectRedis, disconnectRedis } = require("./config/redis");
const path=require('path')
const app = express();

connectDB();
connectRedis();

app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/chat", authMiddleware, chatRoutes);
app.use(errorHandler);
app.use(express.static(path.join(__dirname, 'build')))

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, 'build', "index.html"))
})
const server = app.listen(config.port, () => {
  console.log(`Server is running on port ${config.port}`);
});

const gracefulShutdown = async () => {
  console.log("Received shutdown signal");

  const forceShutdown = setTimeout(() => {
    console.error(
      "Could not close connections in time, forcefully shutting down"
    );
    process.exit(1);
  }, 10000);

  try {
    server.close(() => {
      console.log("Server closed");
    });

    await mongoose.connection.close();
    console.log("MongoDB connection closed");
    disconnectRedis();
    console.log("Redis connection closed");

    clearTimeout(forceShutdown);

    console.log("Graceful shutdown completed");
    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err);
    clearTimeout(forceShutdown);
    process.exit(1);
  }
};

process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  gracefulShutdown();
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
  gracefulShutdown();
});
