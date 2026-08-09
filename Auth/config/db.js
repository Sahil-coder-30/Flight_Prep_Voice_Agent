import mongoose from 'mongoose';

export const connectToDb = async () => {
    try {
        const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGO_URI is not defined in environment variables');
        await mongoose.connect(uri);
        console.log('[Auth DB] Connected to MongoDB successfully');
    } catch (error) {
        console.error('[Auth DB] Connection error:', error.message);
        process.exit(1);
    }
};
