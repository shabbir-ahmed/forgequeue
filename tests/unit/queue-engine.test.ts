import { describe, expect, it } from "vitest";
import { QueueEngine } from "../../packages/core/src/engine/queue-engine.js";

describe("QueueEngine", () => {
	it("creates a pending job", () => {
		const queue = new QueueEngine<{ message: string }>();
		const job = queue.enqueue("send-email", { message: "Hello" });

		expect(job.id).toBeTruthy();
		expect(job.status).toBe("pending");
		expect(job.attempts).toBe(0);
	});

	it("processes jobs in FIFO order", () => {
		const queue = new QueueEngine<number>();

		const first = queue.enqueue("first", 1);
		const second = queue.enqueue("second", 2);

		expect(queue.dequeue()?.id).toBe(first.id);
		expect(queue.dequeue()?.id).toBe(second.id);
	});

	it("returns undefined for an empty queue", () => {
		const queue = new QueueEngine<string>();

		expect(queue.dequeue()).toBeUndefined();
	});

	it("completes a processing job", () => {
		const queue = new QueueEngine<number>();

		const job = queue.enqueue("calculate", 42);

		queue.dequeue(); // Move job to processing

		const completed = queue.complete(job.id);

		expect(completed.status).toBe("completed");
		expect(completed.attempts).toBe(1);
	});

	it("marks a processing job as failed", () => {
		const queue = new QueueEngine<number>();

		const job = queue.enqueue("calculate", 42);

		queue.dequeue(); // Move job to processing

		const failed = queue.fail(job.id);

		expect(failed.status).toBe("failed");
	});

	it("rejects completing a pending job", () => {
		const queue = new QueueEngine<number>();

		const job = queue.enqueue("calculate", 42);

		expect(() => queue.complete(job.id)).toThrow();
	});

	it("rejects unknown job IDs", () => {
		const queue = new QueueEngine<number>();

		expect(() => queue.complete("unknown-id")).toThrow(
			"Job not found: unknown-id",
		);
	});
});
