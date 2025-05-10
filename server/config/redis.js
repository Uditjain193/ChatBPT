const { createClient } = require("redis");
const config = require("./config");
const client = createClient({
  username:config.redis.username,
  password: config.redis.password,
  socket: {
    host: config.redis.host,
    port: config.redis.port, 
  },
});

client.on("error", (err) => console.log("Redis Client Error", err));

const connectRedis = async () => {
  if (!client.isOpen) {
    await client.connect();
    console.log("Connected to Redis");
  }
};

const disconnectRedis = async () => {
  if (client.isOpen) {
    client.destroy();
  }
};

module.exports = { client, connectRedis, disconnectRedis };
