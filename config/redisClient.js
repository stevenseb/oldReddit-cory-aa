const redis = require('redis');
// Initialize Redis client
const redisClient = redis.createClient({
  host: '127.0.0.1', // Change this if you're using a hosted Redis service
  port: 6379,
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.log('Redis Client Error', err);
});

module.exports = redisClient;