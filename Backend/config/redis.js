import Redis from 'ioredis';

let redisClient = null;

export const connectToRedis = () => {
    try {
        const uri = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = new Redis(uri);

        redisClient.on('connect', () => console.log('[Backend Redis] Connected successfully'));
        redisClient.on('error', (err) => console.error('[Backend Redis] Error:', err.message));

        return redisClient;
    } catch (error) {
        console.error('[Backend Redis] Connection error:', error.message);
        process.exit(1);
    }
};

export const getRedisClient = () => {
    if (!redisClient) throw new Error('[Backend Redis] Client not initialized — call connectToRedis() first');
    return redisClient;
};
