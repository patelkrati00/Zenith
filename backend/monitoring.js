/**
 * Monitoring and Analytics System
 * Track execution metrics, resource usage, and system health
 */

import os from 'os';
import { EventEmitter } from 'events';

class MonitoringService extends EventEmitter {
    constructor() {
        super();
        
        this.metrics = {
            executions: {
                total: 0,
                successful: 0,
                failed: 0,
                byLanguage: {},
                byUser: {}
            },
            performance: {
                averageExecutionTime: 0,
                totalExecutionTime: 0,
                peakConcurrency: 0,
                currentConcurrency: 0
            },
            resources: {
                cpuUsage: [],
                memoryUsage: [],
                diskUsage: []
            },
            errors: {
                total: 0,
                byType: {},
                recent: []
            },
            queue: {
                currentSize: 0,
                peakSize: 0,
                averageWaitTime: 0,
                totalProcessed: 0
            }
        };
        
        this.executionHistory = [];
        this.maxHistorySize = 1000;
        
        // Start resource monitoring
        this.startResourceMonitoring();
    }
    
    /**
     * Record execution start
     */
    recordExecutionStart(executionId, language, user) {
        const execution = {
            id: executionId,
            language,
            user,
            startTime: Date.now(),
            status: 'running'
        };
        
        this.executionHistory.push(execution);
        this.metrics.executions.total++;
        this.metrics.performance.currentConcurrency++;
        
        if (this.metrics.performance.currentConcurrency > this.metrics.performance.peakConcurrency) {
            this.metrics.performance.peakConcurrency = this.metrics.performance.currentConcurrency;
        }
        
        // Track by language
        if (!this.metrics.executions.byLanguage[language]) {
            this.metrics.executions.byLanguage[language] = { total: 0, successful: 0, failed: 0 };
        }
        this.metrics.executions.byLanguage[language].total++;
        
        // Track by user
        if (!this.metrics.executions.byUser[user]) {
            this.metrics.executions.byUser[user] = { total: 0, successful: 0, failed: 0 };
        }
        this.metrics.executions.byUser[user].total++;
        
        this.emit('execution:start', execution);
        
        return execution;
    }
    
    /**
     * Record execution completion
     */
    recordExecutionComplete(executionId, exitCode, error = null) {
        const execution = this.executionHistory.find(e => e.id === executionId);
        if (!execution) return;
        
        execution.endTime = Date.now();
        execution.duration = execution.endTime - execution.startTime;
        execution.exitCode = exitCode;
        execution.status = exitCode === 0 ? 'success' : 'failed';
        execution.error = error;
        
        this.metrics.performance.currentConcurrency--;
        this.metrics.performance.totalExecutionTime += execution.duration;
        this.metrics.performance.averageExecutionTime = 
            this.metrics.performance.totalExecutionTime / this.metrics.executions.total;
        
        if (exitCode === 0) {
            this.metrics.executions.successful++;
            this.metrics.executions.byLanguage[execution.language].successful++;
            this.metrics.executions.byUser[execution.user].successful++;
        } else {
            this.metrics.executions.failed++;
            this.metrics.executions.byLanguage[execution.language].failed++;
            this.metrics.executions.byUser[execution.user].failed++;
            
            if (error) {
                this.recordError(error, execution);
            }
        }
        
        this.emit('execution:complete', execution);
        
        // Trim history
        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory = this.executionHistory.slice(-this.maxHistorySize);
        }
    }
    
    /**
     * Record error
     */
    recordError(error, context = {}) {
        this.metrics.errors.total++;
        
        const errorType = error.name || 'Unknown';
        if (!this.metrics.errors.byType[errorType]) {
            this.metrics.errors.byType[errorType] = 0;
        }
        this.metrics.errors.byType[errorType]++;
        
        const errorRecord = {
            timestamp: new Date().toISOString(),
            type: errorType,
            message: error.message,
            stack: error.stack,
            context
        };
        
        this.metrics.errors.recent.unshift(errorRecord);
        if (this.metrics.errors.recent.length > 100) {
            this.metrics.errors.recent = this.metrics.errors.recent.slice(0, 100);
        }
        
        this.emit('error', errorRecord);
    }
    
    /**
     * Update queue metrics
     */
    updateQueueMetrics(currentSize, waitTime = 0) {
        this.metrics.queue.currentSize = currentSize;
        
        if (currentSize > this.metrics.queue.peakSize) {
            this.metrics.queue.peakSize = currentSize;
        }
        
        if (waitTime > 0) {
            this.metrics.queue.totalProcessed++;
            const totalWaitTime = this.metrics.queue.averageWaitTime * (this.metrics.queue.totalProcessed - 1) + waitTime;
            this.metrics.queue.averageWaitTime = totalWaitTime / this.metrics.queue.totalProcessed;
        }
    }
    
    /**
     * Start resource monitoring
     */
    startResourceMonitoring() {
        setInterval(() => {
            const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
            const totalMem = os.totalmem();
            const freeMem = os.freemem();
            const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;
            
            this.metrics.resources.cpuUsage.push({
                timestamp: Date.now(),
                value: cpuUsage
            });
            
            this.metrics.resources.memoryUsage.push({
                timestamp: Date.now(),
                value: memoryUsage
            });
            
            // Keep only last 100 readings
            if (this.metrics.resources.cpuUsage.length > 100) {
                this.metrics.resources.cpuUsage.shift();
            }
            if (this.metrics.resources.memoryUsage.length > 100) {
                this.metrics.resources.memoryUsage.shift();
            }
            
            this.emit('resource:update', {
                cpu: cpuUsage,
                memory: memoryUsage
            });
        }, 5000); // Every 5 seconds
    }
    
    /**
     * Get current metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            system: {
                uptime: process.uptime(),
                nodeVersion: process.version,
                platform: os.platform(),
                cpus: os.cpus().length,
                totalMemory: os.totalmem(),
                freeMemory: os.freemem()
            }
        };
    }
    
    /**
     * Get execution history
     */
    getExecutionHistory(limit = 100) {
        return this.executionHistory.slice(-limit).reverse();
    }
    
    /**
     * Get statistics for time period
     */
    getStatistics(startTime, endTime) {
        const executions = this.executionHistory.filter(e => 
            e.startTime >= startTime && e.startTime <= endTime
        );
        
        const successful = executions.filter(e => e.status === 'success').length;
        const failed = executions.filter(e => e.status === 'failed').length;
        const totalDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0);
        
        return {
            period: {
                start: new Date(startTime).toISOString(),
                end: new Date(endTime).toISOString()
            },
            executions: {
                total: executions.length,
                successful,
                failed,
                successRate: executions.length > 0 ? (successful / executions.length * 100) : 0
            },
            performance: {
                totalDuration,
                averageDuration: executions.length > 0 ? totalDuration / executions.length : 0,
                minDuration: Math.min(...executions.map(e => e.duration || 0)),
                maxDuration: Math.max(...executions.map(e => e.duration || 0))
            }
        };
    }
    
    /**
     * Reset metrics
     */
    reset() {
        this.metrics = {
            executions: {
                total: 0,
                successful: 0,
                failed: 0,
                byLanguage: {},
                byUser: {}
            },
            performance: {
                averageExecutionTime: 0,
                totalExecutionTime: 0,
                peakConcurrency: 0,
                currentConcurrency: 0
            },
            resources: {
                cpuUsage: [],
                memoryUsage: [],
                diskUsage: []
            },
            errors: {
                total: 0,
                byType: {},
                recent: []
            },
            queue: {
                currentSize: 0,
                peakSize: 0,
                averageWaitTime: 0,
                totalProcessed: 0
            }
        };
        this.executionHistory = [];
    }
}

// Singleton instance
export const monitoring = new MonitoringService();
