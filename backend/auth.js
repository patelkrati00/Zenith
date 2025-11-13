/**
 * Authentication System
 * Simple JWT-based authentication for the IDE
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// In-memory user store (replace with database in production)
const users = new Map();

// Default admin user
if (process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    users.set(process.env.ADMIN_USERNAME, {
        id: 'admin',
        username: process.env.ADMIN_USERNAME,
        password: hashPassword(process.env.ADMIN_PASSWORD),
        role: 'admin',
        createdAt: new Date().toISOString()
    });
}

/**
 * Hash password using SHA-256
 */
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

/**
 * Register new user
 */
export function registerUser(username, password, role = 'user') {
    if (users.has(username)) {
        throw new Error('Username already exists');
    }
    
    const user = {
        id: crypto.randomUUID(),
        username,
        password: hashPassword(password),
        role,
        createdAt: new Date().toISOString(),
        executionCount: 0,
        totalExecutionTime: 0
    };
    
    users.set(username, user);
    return { id: user.id, username: user.username, role: user.role };
}

/**
 * Authenticate user
 */
export function authenticateUser(username, password) {
    const user = users.get(username);
    
    if (!user) {
        throw new Error('Invalid credentials');
    }
    
    const hashedPassword = hashPassword(password);
    if (user.password !== hashedPassword) {
        throw new Error('Invalid credentials');
    }
    
    // Generate JWT token
    const token = jwt.sign(
        { 
            id: user.id, 
            username: user.username, 
            role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
    
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            role: user.role
        }
    };
}

/**
 * Verify JWT token
 */
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return decoded;
    } catch (err) {
        throw new Error('Invalid or expired token');
    }
}

/**
 * Express middleware for authentication
 */
export function authMiddleware(req, res, next) {
    // Skip auth if disabled
    if (process.env.DISABLE_AUTH === 'true') {
        req.user = { id: 'anonymous', username: 'anonymous', role: 'user' };
        return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7);
    
    try {
        const decoded = verifyToken(token);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: err.message });
    }
}

/**
 * WebSocket authentication
 */
export function authenticateWebSocket(ws, req) {
    // Skip auth if disabled
    if (process.env.DISABLE_AUTH === 'true') {
        return { id: 'anonymous', username: 'anonymous', role: 'user' };
    }
    
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (!token) {
        ws.close(1008, 'No token provided');
        throw new Error('No token provided');
    }
    
    try {
        const decoded = verifyToken(token);
        return decoded;
    } catch (err) {
        ws.close(1008, 'Invalid token');
        throw new Error('Invalid token');
    }
}

/**
 * Admin-only middleware
 */
export function adminOnly(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}

/**
 * Get user by username
 */
export function getUserByUsername(username) {
    const user = users.get(username);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
}

/**
 * Get all users (admin only)
 */
export function getAllUsers() {
    return Array.from(users.values()).map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    });
}

/**
 * Update user stats
 */
export function updateUserStats(username, executionTime) {
    const user = users.get(username);
    if (user) {
        user.executionCount = (user.executionCount || 0) + 1;
        user.totalExecutionTime = (user.totalExecutionTime || 0) + executionTime;
        user.lastExecutionAt = new Date().toISOString();
    }
}

/**
 * Delete user
 */
export function deleteUser(username) {
    if (!users.has(username)) {
        throw new Error('User not found');
    }
    users.delete(username);
}
