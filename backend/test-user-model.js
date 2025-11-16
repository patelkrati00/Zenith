// test-user-model.js
import User from './models/User.js';
import { connectDB } from './config/database.js';

await connectDB();

try {
    const testUser = new User({
        username: 'testuser',
        password: 'test123'
    });

    const savedUser = await testUser.save();
    console.log('User saved successfully:', savedUser);
} catch (error) {
    console.error('Error:', error.message);
}
