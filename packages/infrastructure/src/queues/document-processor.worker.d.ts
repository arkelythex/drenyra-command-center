import { Worker } from "bullmq";
import type { DocumentJobData, DocumentJobResult } from "./document-processor.queue";
export declare function startWorker(): Worker<DocumentJobData, DocumentJobResult> | null;
export declare function stopWorker(): Promise<void>;
export declare function isWorkerRunning(): boolean;
export declare function processDocumentSync(data: DocumentJobData): Promise<DocumentJobResult>;
//# sourceMappingURL=document-processor.worker.d.ts.map