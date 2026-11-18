import { describe, expect, it } from "vitest";
import { Job, JobStatus } from "../../packages/core/src/types/job.js";
import {
	InvalidJobTransitionError,
	transitionJob,
} from "../../packages/core/src/engine/state-machine.js";

function createJob(status: JobStatus = "pending"): Job<{ value: number }> {
	const now = new Date();
	return {
		id: "test-job-1",
		name: "test-job",
		payload: { value: 10 },
		status,
		attempts: 0,
		createdAt: now,
		updatedAt: now,
	};
}

describe("Job State Machine", () => {
	it("moves pending to processing", () => {
		const job = createJob();

		const updated = transitionJob(job, "processing");

		expect(updated.status).toBe("processing");
		expect(updated.attempts).toBe(1);
		expect(job.status).toBe("pending"); // Ensure original job is unchanged
	});

	it("moves processing to faild", () => {
		const job = createJob("processing");

		const updated = transitionJob(job, "failed");

		expect(updated.status).toBe("failed");
	});

	it("rejects transitions from completed", () => {
		const job = createJob("completed");

		expect(() => transitionJob(job, "processing")).toThrow(
			InvalidJobTransitionError,
		);
	});
});
