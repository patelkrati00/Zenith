/**
 * Authentication Routes
 */

import express from 'express';
import { register, login, profile } from '../controllers/authController.js';
import { authMiddleware as verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * POST /auth/register
 * Register new user (Mongo-backed)
 */
router.post('/register', register);

/**
 * POST /auth/login
 * Authenticate user and get JWT
 */
router.post('/login', login);

/**
 * GET /auth/profile
 * Get current logged-in user (protected)
 */
router.get('/profile', verifyToken, profile);

export default router;
