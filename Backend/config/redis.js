import Redis from 'ioredis';

let redisClient = null;
let errorLogged = false;

const memoryFallback = new Map();

export const connectToRedis = () => {
    try {
        const uri = process.env.REDIS_URL || process.env.REDIS_URI || 'redis://localhost:6379';

        redisClient = new Redis(uri, {
            maxRetriesPerRequest: null,
            enableOfflineQueue: true,
            retryStrategy(times) {
                return Math.min(times * 2000, 10000);
            },
        });

        redisClient.on('connect', () => {
            errorLogged = false;
            console.log('[Backend Redis] Connected successfully');
        });

        redisClient.on('error', (err) => {
            if (!errorLogged) {
                console.warn(`[Backend Redis] Connection warning (${err.message}). Operating in resilient mode.`);
                errorLogged = true;
            }
        });

        return redisClient;
    } catch (error) {
        console.warn('[Backend Redis] Initialization warning:', error.message);
        return createFallbackClient();
    }
};

export const getRedisClient = () => {
    if (!redisClient) {
        return connectToRedis();
    }
    return redisClient;
};

function createFallbackClient() {
    return {
        get: async (key) => memoryFallback.get(key) || null,
        set: async (key, val) => { memoryFallback.set(key, val); return 'OK'; },
        setex: async (key, ttl, val) => { memoryFallback.set(key, val); return 'OK'; },
        del: async (key) => memoryFallback.delete(key),
        incr: async (key) => {
            const curr = (parseInt(memoryFallback.get(key), 10) || 0) + 1;
            memoryFallback.set(key, String(curr));
            return curr;
        },
        expire: async () => 1,
    };
}
