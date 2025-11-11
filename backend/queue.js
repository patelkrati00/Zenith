import { EventEmitter } from 'events';
import { nanoid } from 'nanoid';

/**
 * Job Queue Manager
 * Handles concurrent execution limits, priority queuing, and rate limiting
 */
export class JobQueue extends EventEmitter {
    constructor(options = {}) {
        super();
        
        this.maxConcurrent = options.maxConcurrent || 5;
        this.maxQueueSize = options.maxQueueSize || 100;
        this.jobTimeout = options.jobTimeout || 30000; // 30s default
        
        // Queue storage
        this.queue = []; // Pending jobs
        this.running = new Map(); // Currently running jobs
        this.completed = new Map(); // Completed jobs (last 100)
        this.failed = new Map(); // Failed jobs (last 100)
        
        // Statistics
        this.stats = {
            totalQueued: 0,
            totalProcessed: 0,
            totalFailed: 0,
            totalTimeout: 0,
            averageWaitTime: 0,
            averageExecutionTime: 0
        };
    }

    /**
     * Add a job to the queue
     */
    async enqueue(jobData, priority = 0) {
        // Check queue size limit
        if (this.queue.length >= this.maxQueueSize) {
            throw new Error(`Queue is full (max: ${this.maxQueueSize})`);
        }

        const job = {
            id: nanoid(10),
            data: jobData,
            priority,
            status: 'queued',
            queuedAt: Date.now(),
            startedAt: null,
            completedAt: null,
            result: null,
            error: null
        };

        // Insert based on priority (higher priority first)
        const insertIndex = this.queue.findIndex(j => j.priority < priority);
        if (insertIndex === -1) {
            this.queue.push(job);
        } else {
            this.queue.splice(insertIndex, 0, job);
        }

        this.stats.totalQueued++;
        this.emit('job:queued', job);

        // Try to process immediately
        this.processNext();

        return job.id;
    }

    /**
     * Process next job in queue if capacity available
     */
    async processNext() {
        // Check if we have capacity
        if (this.running.size >= this.maxConcurrent) {
            return;
        }

        // Get next job
        const job = this.queue.shift();
        if (!job) {
            return;
        }

        // Mark as running
        job.status = 'running';
        job.startedAt = Date.now();
        this.running.set(job.id, job);

        this.emit('job:started', job);

        // Set timeout
        const timeoutHandle = setTimeout(() => {
            this.handleJobTimeout(job.id);
        }, this.jobTimeout);

        try {
            // Execute the job (emit event for external handler)
            this.emit('job:execute', job, (error, result) => {
                clearTimeout(timeoutHandle);
                if (error) {
                    this.handleJobFailure(job.id, error);
                } else {
                    this.handleJobSuccess(job.id, result);
                }
            });
        } catch (error) {
            clearTimeout(timeoutHandle);
            this.handleJobFailure(job.id, error);
        }
    }

    /**
     * Handle successful job completion
     */
    handleJobSuccess(jobId, result) {
        const job = this.running.get(jobId);
        if (!job) return;

        job.status = 'completed';
        job.completedAt = Date.now();
        job.result = result;

        // Calculate times
        const waitTime = job.startedAt - job.queuedAt;
        const executionTime = job.completedAt - job.startedAt;

        // Update statistics
        this.stats.totalProcessed++;
        this.updateAverageWaitTime(waitTime);
        this.updateAverageExecutionTime(executionTime);

        // Move to completed
        this.running.delete(jobId);
        this.completed.set(jobId, job);

        // Keep only last 100 completed jobs
        if (this.completed.size > 100) {
            const firstKey = this.completed.keys().next().value;
            this.completed.delete(firstKey);
        }

        this.emit('job:completed', job);

        // Process next job
        this.processNext();
    }

    /**
     * Handle job failure
     */
    handleJobFailure(jobId, error) {
        const job = this.running.get(jobId);
        if (!job) return;

        job.status = 'failed';
        job.completedAt = Date.now();
        job.error = error.message || String(error);

        // Update statistics
        this.stats.totalFailed++;

        // Move to failed
        this.running.delete(jobId);
        this.failed.set(jobId, job);

        // Keep only last 100 failed jobs
        if (this.failed.size > 100) {
            const firstKey = this.failed.keys().next().value;
            this.failed.delete(firstKey);
        }

        this.emit('job:failed', job);

        // Process next job
        this.processNext();
    }

    /**
     * Handle job timeout
     */
    handleJobTimeout(jobId) {
        const job = this.running.get(jobId);
        if (!job) return;

        job.status = 'timeout';
        job.completedAt = Date.now();
        job.error = 'Job execution timeout';

        // Update statistics
        this.stats.totalTimeout++;
        this.stats.totalFailed++;

        // Move to failed
        this.running.delete(jobId);
        this.failed.set(jobId, job);

        this.emit('job:timeout', job);

        // Process next job
        this.processNext();
    }

    /**
     * Cancel a job
     */
    cancel(jobId) {
        // Check if in queue
        const queueIndex = this.queue.findIndex(j => j.id === jobId);
        if (queueIndex !== -1) {
            const job = this.queue.splice(queueIndex, 1)[0];
            job.status = 'cancelled';
            job.completedAt = Date.now();
            this.emit('job:cancelled', job);
            return true;
        }

        // Cannot cancel running jobs (handled by caller)
        return false;
    }

    /**
     * Get job status
     */
    getJob(jobId) {
        // Check running
        if (this.running.has(jobId)) {
            return this.running.get(jobId);
        }

        // Check completed
        if (this.completed.has(jobId)) {
            return this.completed.get(jobId);
        }

        // Check failed
        if (this.failed.has(jobId)) {
            return this.failed.get(jobId);
        }

        // Check queue
        const queuedJob = this.queue.find(j => j.id === jobId);
        if (queuedJob) {
            return queuedJob;
        }

        return null;
    }

    /**
     * Get queue statistics
     */
    getStats() {
        return {
            ...this.stats,
            queueLength: this.queue.length,
            runningCount: this.running.size,
            maxConcurrent: this.maxConcurrent,
            maxQueueSize: this.maxQueueSize
        };
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return {
            queued: this.queue.map(j => ({
                id: j.id,
                priority: j.priority,
                queuedAt: j.queuedAt,
                waitTime: Date.now() - j.queuedAt
            })),
            running: Array.from(this.running.values()).map(j => ({
                id: j.id,
                startedAt: j.startedAt,
                runningTime: Date.now() - j.startedAt
            }))
        };
    }

    /**
     * Update average wait time
     */
    updateAverageWaitTime(waitTime) {
        const n = this.stats.totalProcessed;
        this.stats.averageWaitTime = 
            (this.stats.averageWaitTime * (n - 1) + waitTime) / n;
    }

    /**
     * Update average execution time
     */
    updateAverageExecutionTime(executionTime) {
        const n = this.stats.totalProcessed;
        this.stats.averageExecutionTime = 
            (this.stats.averageExecutionTime * (n - 1) + executionTime) / n;
    }

    /**
     * Clear completed and failed jobs
     */
    clearHistory() {
        this.completed.clear();
        this.failed.clear();
    }

    /**
     * Shutdown queue (cancel all pending jobs)
     */
    shutdown() {
        // Cancel all queued jobs
        while (this.queue.length > 0) {
            const job = this.queue.shift();
            job.status = 'cancelled';
            job.completedAt = Date.now();
            this.emit('job:cancelled', job);
        }

        this.emit('queue:shutdown');
    }
}
