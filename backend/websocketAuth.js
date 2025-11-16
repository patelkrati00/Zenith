/**
 * Legacy Authentication for WebSocket + Admin Tools
 */

import jwt from 'jsonwebtoken';

/**
 * Verify token (used for WebSocket only)
 */
function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * WebSocket authentication
 */
export function authenticateWebSocket(ws, req) {
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
        return verifyToken(token);
    } catch (err) {
        ws.close(1008, 'Invalid token');
        throw new Error('Invalid token');
    }
}

/**
 * Admin-only middleware (still useful for monitoring panel)
 */
export function adminOnly(req, res, next) {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
}
