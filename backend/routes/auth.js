/**
 * Authentication Routes
 */

import express from 'express';
import { registerUser, authenticateUser, authMiddleware, adminOnly, getAllUsers, deleteUser } from '../auth.js';

const router = express.Router();

/**
 * POST /auth/register
 * Register new user
 */
router.post('/register', (req, res) => {
    try {
        const { username, password, role } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        const user = registerUser(username, password, role);
        res.json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * POST /auth/login
 * Authenticate user and get token
 */
router.post('/login', (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }
        
        const result = authenticateUser(username, password);
        res.json(result);
    } catch (error) {
        res.status(401).json({ error: error.message });
    }
});

/**
 * GET /auth/me
 * Get current user info
 */
router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

/**
 * GET /auth/users
 * Get all users (admin only)
 */
router.get('/users', authMiddleware, adminOnly, (req, res) => {
    const users = getAllUsers();
    res.json({ users });
});

/**
 * DELETE /auth/users/:username
 * Delete user (admin only)
 */
router.delete('/users/:username', authMiddleware, adminOnly, (req, res) => {
    try {
        const { username } = req.params;
        deleteUser(username);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});

export default router;
