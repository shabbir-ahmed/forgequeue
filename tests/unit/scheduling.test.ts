import { describe, expect, it } from "vitest";

import { QueueEngine } from "../../packages/core/src/engine/queue-engine.js";

describe("Priority and Scheduling", () => {
	it("processes higher priority first", () => {
		const queue = new QueueEngine<string>();

		const low = queue.enqueue("low", "A", { priority: 1 });

		const high = queue.enqueue("high", "B", { priority: 10 });

		const medium = queue.enqueue("medium", "C", { priority: 5 });

		expect(queue.dequeue()?.id).toBe(high.id);
		expect(queue.dequeue()?.id).toBe(medium.id);
		expect(queue.dequeue()?.id).toBe(low.id);
	});

	it("maintains FIFO for equal priorities", () => {
		const queue = new QueueEngine<number>();

		const first = queue.enqueue("first", 1, { priority: 5 });

		const second = queue.enqueue("second", 2, { priority: 5 });

		expect(queue.dequeue()?.id).toBe(first.id);
		expect(queue.dequeue()?.id).toBe(second.id);
	});

	it("does not dequeue a job before its scheduled time", () => {
		let now = 1_700_000_000_000;

		const queue = new QueueEngine<string>(() => now);

		const job = queue.enqueue("delayed", "data", { delayMs: 5000 });

		expect(queue.dequeue()).toBeUndefined();

		now += 4999;

		expect(queue.dequeue()).toBeUndefined();

		now += 1;

		expect(queue.dequeue()?.id).toBe(job.id);
	});

	it("runs ready jobs while delayed jobs wait", () => {
		const queue = new QueueEngine<string>();

		queue.enqueue("delayed", "later", { priority: 10, delayMs: 60_000 });

		const ready = queue.enqueue("ready", "now", { priority: 1 });

		expect(queue.dequeue()?.id).toBe(ready.id);
	});

	it("prioritizes due jobs after promotion", () => {
		let now = 1_700_000_000_000;

		const queue = new QueueEngine<string>(() => now);

		queue.enqueue("low", "first", { priority: 1 });

		const urgent = queue.enqueue("urgent", "later", {
			priority: 10,
			delayMs: 5000,
		});

		now += 5000;

		expect(queue.dequeue()?.id).toBe(urgent.id);
	});

	it("rejects invalid scheduling options", () => {
		const queue = new QueueEngine<string>();

		expect(() =>
			queue.enqueue("invalid", "data", { priority: 11 }),
		).toThrow(RangeError);

		expect(() =>
			queue.enqueue("invalid", "data", { delayMs: -100 }),
		).toThrow(RangeError);
	});
});
