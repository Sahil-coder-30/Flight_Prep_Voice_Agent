import 'dotenv/config';
import app from './app/app.js';
import { connectToDb } from './config/db.js';

const PORT = process.env.PORT || 7000;

app.listen(PORT, async () => {
    await connectToDb();
    console.log(`[AI Service] Server is running on port ${PORT}`);
});
