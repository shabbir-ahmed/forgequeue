import type { Job, JobStatus } from "../types/job.ts";

const allowedTransitions: Record<JobStatus, readonly JobStatus[]> = {
	pending: ["processing"],
	processing: ["completed", "failed"],
	completed: [],
	failed: [],
};

export class InvalidJobTransitionError extends Error {
	constructor(current: JobStatus, next: JobStatus) {
		super(`Invalid job transition: ${current} -> ${next}`);
		this.name = "InvalidJobTransitionError";
	}
}

export function transitionJob<TPayload>(
	job: Job<TPayload>,
	nextStatus: JobStatus,
	at: Date = new Date(),
): Job<TPayload> {
	if (!allowedTransitions[job.status].includes(nextStatus)) {
		throw new InvalidJobTransitionError(job.status, nextStatus);
	}

	return {
		...job,
		status: nextStatus,
		attempts: nextStatus === "processing" ? job.attempts + 1 : job.attempts,
		updatedAt: new Date(at),
	};
}
