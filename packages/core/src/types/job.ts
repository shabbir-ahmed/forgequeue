export type JobStatus = "pending" | "processing" | "completed" | "failed";

export interface Job<TPayload> {
	readonly id: string;
	readonly name: string;
	readonly payload: TPayload;

	readonly status: JobStatus;
	readonly attempts: number;

	readonly priority: number;
	readonly runAt: Date;

	readonly createdAt: Date;
	readonly updatedAt: Date;
}

export interface EnqueueOptions {
	readonly priority?: number;
	readonly delayMs?: number;
}
