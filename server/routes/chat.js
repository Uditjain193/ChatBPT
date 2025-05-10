const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

router.get("/history", chatController.getHistory);

router.get("/:chatId", chatController.getChat);

router.delete("/delete/:chatId", chatController.deleteChat);

router.post("/", chatController.handleMessage);

module.exports = router;
