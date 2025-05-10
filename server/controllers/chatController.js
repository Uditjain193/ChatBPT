const Chat = require("../models/Chat");
const User = require("../models/User");
const getResponseFromOpenai = require("../external/openai");
const { client } = require("../config/redis");
const mongoose = require("mongoose");

const chatController = {
  getHistory: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 5;
      const skip = (page - 1) * limit;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      const chats = await Chat.find({ user: userId })
        .select("title")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await Chat.countDocuments({ user: userId });

      return res.json({
        success: true,
        data: chats,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      });
    } catch (error) {
      next(error);
    }
  },

  getChat: async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const userId = req.user._id;

      if (
        !mongoose.Types.ObjectId.isValid(chatId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
        });
      }

      const cachedMessages = await client.get(`chat:${chatId}`);
      if (cachedMessages) {
        return res.json({
          success: true,
          messages: JSON.parse(cachedMessages),
        });
      }

      const chat = await Chat.findOne({
        _id: chatId,
        user: userId,
      });

      if (!chat) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      await client.set(
        `chat:${chatId}`,
        JSON.stringify(chat.messages),
        "EX",
        60 * 60
      );

      return res.json({
        success: true,
        messages: chat.messages,
      });
    } catch (error) {
      next(error);
    }
  },

  deleteChat: async (req, res, next) => {
    try {
      const { chatId } = req.params;
      const userId = req.user._id;

      if (
        !mongoose.Types.ObjectId.isValid(chatId) ||
        !mongoose.Types.ObjectId.isValid(userId)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid ID format",
        });
      }

      const result = await Chat.deleteOne({
        _id: chatId,
        user: userId,
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: "Chat not found",
        });
      }

      await client.del(`chat:${chatId}`);
      return res.json({
        success: true,
        message: "Chat deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  },

  handleMessage: async (req, res, next) => {
    try {
      const { message, chatId } = req.body;
      const userId = req.user._id;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID format",
        });
      }

      if (chatId && !mongoose.Types.ObjectId.isValid(chatId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid chat ID format",
        });
      }

      const user = await User.findById(userId);
      const today = new Date().toDateString();

      if (
        !user.lastMessageDate ||
        new Date(user.lastMessageDate).toDateString() !== today
      ) {
        user.messageCount = 0;
        user.lastMessageDate = new Date();
      }

      if (user.tier === "free" && user.messageCount >= 5) {
        return res.json({
          success: false,
          message:
            "Daily message limit reached for free users. Please upgrade your account.",
        });
      }

      const messageArray = [
        {
          role: "user",
          content: message,
        },
      ];

      const aiMessage = await getResponseFromOpenai(messageArray);

      let chat;
      if (chatId) {
        chat = await Chat.findOne({ _id: chatId, user: userId });
        if (!chat) {
          return res.status(404).json({
            success: false,
            message: "Chat not found",
          });
        }
        chat.messages.push(...messageArray, aiMessage);
        await chat.save();
      } else {
        chat = await Chat.create({
          user: userId,
          title: message.substring(0, 50) + "...",
          messages: [...messageArray, aiMessage],
        });
      }

      await client.set(
        `chat:${chatId}`,
        JSON.stringify(chat.messages),
        "EX",
        60 * 60
      );

      if (user.tier === "free") {
        user.messageCount += 1;
        await user.save();
      }

      return res.json({
        success: true,
        chatId: chat._id,
        reply: aiMessage,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = chatController;
