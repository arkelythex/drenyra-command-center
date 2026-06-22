import { SecureLogger } from "@arkelythex/shared/secure-logger";
import { cpus } from "os";
import { Worker } from "worker_threads";
function getErrorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
export class WorkerPool {
    poolSize;
    workers = [];
    available = [];
    tasks = [];
    metrics = { tasksExecuted: 0, tasksFailed: 0, avgExecutionTime: 0 };
    constructor(poolSize = cpus().length) {
        this.poolSize = poolSize;
        this.initializeWorkers();
    }
    initializeWorkers() {
        for (let i = 0; i < this.poolSize; i++) {
            const workerCode = `
				const { parentPort } = require('worker_threads');
				parentPort.on('message', async ({ task, agentCode }) => {
					try {
						const startTime = Date.now();
						const agent = eval(agentCode);
						const result = await agent.execute(task);
						parentPort.postMessage({ success: true, data: result, executionTime: Date.now() - startTime });
					} catch (error) {
						parentPort.postMessage({ success: false, error: error.message, executionTime: Date.now() - startTime });
					}
				});
			`;
            const worker = new Worker(workerCode, { eval: true });
            worker.on("message", (result) => this.handleWorkerMessage(worker, result));
            worker.on("error", (error) => {
                SecureLogger.error("Worker error:", { error: getErrorMessage(error) });
                this.replaceWorker(worker);
            });
            this.workers.push(worker);
            this.available.push(worker);
        }
    }
    handleWorkerMessage(worker, result) {
        const taskInfo = this.tasks.shift();
        if (taskInfo) {
            this.metrics.tasksExecuted++;
            if (result.success) {
                const workerData = result.data;
                taskInfo.resolve({
                    success: true,
                    data: workerData?.data ?? result.data,
                    metrics: workerData?.metrics ?? {
                        duration: result.executionTime,
                        tokensUsed: 0,
                        cost: 0,
                    },
                    errors: workerData?.errors,
                    warnings: workerData?.warnings,
                });
            }
            else {
                this.metrics.tasksFailed++;
                taskInfo.reject(new Error(result.error));
            }
            this.available.push(worker);
            this.processQueue();
        }
    }
    replaceWorker(oldWorker) {
        const index = this.workers.indexOf(oldWorker);
        if (index > -1) {
            oldWorker.terminate();
            SecureLogger.warn("Worker replaced due to error");
        }
    }
    async execute(task, agent) {
        return new Promise((resolve, reject) => {
            this.tasks.push({ task, agent, resolve, reject });
            this.processQueue();
        });
    }
    processQueue() {
        while (this.available.length > 0 && this.tasks.length > 0) {
            const worker = this.available.pop();
            const taskInfo = this.tasks[0];
            if (worker && taskInfo) {
                worker.postMessage({
                    task: taskInfo.task,
                    agentCode: taskInfo.agent.execute.toString(),
                });
            }
        }
    }
    getMetrics() {
        return {
            ...this.metrics,
            poolSize: this.poolSize,
            availableWorkers: this.available.length,
            pendingTasks: this.tasks.length,
        };
    }
    terminate() {
        this.workers.forEach((worker) => worker.terminate());
    }
}
//# sourceMappingURL=orchestrator-2026.worker-pool.js.map