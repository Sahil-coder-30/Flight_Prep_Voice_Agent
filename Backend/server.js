import 'dotenv/config';
import app from './app/app.js';
import { connectToDb } from './config/db.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    await connectToDb();
    console.log(`[Backend] Server is running on port ${PORT}`);
});
