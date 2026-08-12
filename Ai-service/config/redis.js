import Redis from 'ioredis';

let redisClient = null;

export const connectToRedis = () => {
    try {
        const uri = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = new Redis(uri);

        redisClient.on('connect', () => console.log('[AI Service Redis] Connected successfully'));
        redisClient.on('error', (err) => console.error('[AI Service Redis] Error:', err.message));

        return redisClient;
    } catch (error) {
        console.error('[AI Service Redis] Connection error:', error.message);
        process.exit(1);
    }
};

export const getRedisClient = () => {
    if (!redisClient) {
        return connectToRedis();
    }
    return redisClient;
};

