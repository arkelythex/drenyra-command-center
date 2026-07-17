export class WorkerPool {
    maxWorkers;
    queueCapacity;
    activeCount = 0;
    tasksExecuted = 0;
    tasksFailed = 0;
    shutdownRequested = false;
    queue = [];
    constructor(config = {}) {
        this.maxWorkers = config.maxWorkers ?? 4;
        this.queueCapacity = config.queueCapacity ?? 1000;
    }
    async execute(_task, executor) {
        if (this.shutdownRequested) {
            throw new Error("Worker pool is shut down");
        }
        if (this.queue.length >= this.queueCapacity) {
            throw new Error("Worker pool queue is full");
        }
        return new Promise((resolve, reject) => {
            this.queue.push({ executor, resolve, reject });
            this.processQueue();
        });
    }
    processQueue() {
        while (this.activeCount < this.maxWorkers && this.queue.length > 0) {
            const task = this.queue.shift();
            this.activeCount++;
            this.executeTask(task);
        }
    }
    async executeTask(task) {
        try {
            const result = await task.executor();
            this.tasksExecuted++;
            task.resolve(result);
        }
        catch (error) {
            this.tasksFailed++;
            task.reject(error instanceof Error ? error : new Error(String(error)));
        }
        finally {
            this.activeCount--;
            this.processQueue();
        }
    }
    getMetrics() {
        return {
            maxWorkers: this.maxWorkers,
            activeWorkers: this.activeCount,
            queuedTasks: this.queue.length,
            tasksExecuted: this.tasksExecuted,
            tasksFailed: this.tasksFailed,
        };
    }
    shutdown() {
        this.shutdownRequested = true;
        this.queue = [];
    }
}
//# sourceMappingURL=worker-pool.js.map