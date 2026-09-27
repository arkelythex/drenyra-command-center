import type { ThreadProps, ThreadStatus } from "./types";
export declare function assertValidThreadProps(props: ThreadProps): void;
export declare function assertValidTransition(currentStatus: ThreadStatus, nextStatus: ThreadStatus): void;
export declare function assertThreadCanActivate(tasks: {
    status: string;
}[]): void;
export declare function assertThreadCanSubmitForReview(tasks: {
    status: string;
}[]): void;
export declare function assertThreadNotClosed(status: ThreadStatus): void;
export declare function assertValidDate(value: string, field: string): Date;
//# sourceMappingURL=thread.validators.d.ts.map