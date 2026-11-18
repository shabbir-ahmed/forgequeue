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
): Job<TPayload> {
	const allowed = allowedTransitions[job.status];

	if (!allowed.includes(nextStatus)) {
		throw new InvalidJobTransitionError(job.status, nextStatus);
	}

	return {
		...job,
		status: nextStatus,
		attempts: nextStatus === "processing" ? job.attempts + 1 : job.attempts,
		updatedAt: new Date(),
	};
}
