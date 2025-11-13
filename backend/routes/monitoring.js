/**
 * Monitoring Routes
 */

import express from 'express';
import { monitoring } from '../monitoring.js';
import { authMiddleware, adminOnly } from '../auth.js';

const router = express.Router();

/**
 * GET /monitoring/metrics
 * Get current metrics
 */
router.get('/metrics', authMiddleware, (req, res) => {
    const metrics = monitoring.getMetrics();
    res.json(metrics);
});

/**
 * GET /monitoring/history
 * Get execution history
 */
router.get('/history', authMiddleware, (req, res) => {
    const limit = parseInt(req.query.limit) || 100;
    const history = monitoring.getExecutionHistory(limit);
    res.json({ history });
});

/**
 * GET /monitoring/statistics
 * Get statistics for time period
 */
router.get('/statistics', authMiddleware, (req, res) => {
    const endTime = Date.now();
    const startTime = endTime - (24 * 60 * 60 * 1000); // Last 24 hours
    
    const stats = monitoring.getStatistics(startTime, endTime);
    res.json(stats);
});

/**
 * POST /monitoring/reset
 * Reset metrics (admin only)
 */
router.post('/reset', authMiddleware, adminOnly, (req, res) => {
    monitoring.reset();
    res.json({ message: 'Metrics reset successfully' });
});

/**
 * GET /monitoring/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
    const metrics = monitoring.getMetrics();
    
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
            percentage: (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100
        },
        executions: {
            total: metrics.executions.total,
            active: metrics.performance.currentConcurrency,
            successRate: metrics.executions.total > 0 
                ? (metrics.executions.successful / metrics.executions.total * 100) 
                : 100
        }
    };
    
    // Determine health status
    if (health.memory.percentage > 90) {
        health.status = 'unhealthy';
        health.issues = ['High memory usage'];
    } else if (health.memory.percentage > 75) {
        health.status = 'degraded';
        health.warnings = ['Elevated memory usage'];
    }
    
    res.json(health);
});

export default router;
