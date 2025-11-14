import mongoose from 'mongoose';
import dotenv from "dotenv";
dotenv.config({ path: "./.env" }); // force load .env

/**
 * Connect to MongoDB database
 */
export async function connectDB() {
    try {
        console.log("MONGO_URI →", process.env.MONGO_URI);  // ← ADD THIS

        const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/zenithide';
        await mongoose.connect(mongoURI, { family: 4 });
        
        console.log('✅ MongoDB connected successfully');
        console.log(`📦 Database: ${mongoose.connection.name}`);
    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
}
