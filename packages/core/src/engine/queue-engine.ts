import { randomUUID } from "node:crypto";

import type { EnqueueOptions, Job } from "../types/job.ts";
import { BinaryHeap } from "../structures/binary-heap.js";
import { transitionJob } from "./state-machine.js";

interface ReadyItem {
	readonly id: string;
	readonly priority: number;
	readonly sequence: number;
}

interface DelayedItem {
	readonly id: string;
	readonly runAt: number;
	readonly sequence: number;
}

export class QueueEngine<TPayload> {
	private readonly jobs = new Map<string, Job<TPayload>>();

	private readonly ready = new BinaryHeap<ReadyItem>(
		(a, b) => b.priority - a.priority || a.sequence - b.sequence,
	);

	private readonly delayed = new BinaryHeap<DelayedItem>(
		(a, b) => a.runAt - b.runAt || a.sequence - b.sequence,
	);

	private sequence = 0;

	constructor(private readonly now: () => number = Date.now) {}

	enqueue(
		name: string,
		payload: TPayload,
		options: EnqueueOptions = {},
	): Job<TPayload> {
		if (!name.trim()) {
			throw new Error("Job name cannot be empty");
		}

		const priority = options.priority ?? 0;
		const delayMs = options.delayMs ?? 0;

		if (!Number.isSafeInteger(priority) || priority < 0 || priority > 10) {
			throw new RangeError(
				"Priority must be an integer between 0 and 10",
			);
		}

		if (!Number.isSafeInteger(delayMs) || delayMs < 0) {
			throw new RangeError("Delay must be a non-negative integer");
		}

		const nowMs = this.currentTime();
		const runAtMs = nowMs + delayMs;

		if (!Number.isFinite(new Date(runAtMs).getTime())) {
			throw new RangeError("Scheduled time is out of range");
		}

		const timestamp = new Date(nowMs);

		const job: Job<TPayload> = {
			id: randomUUID(),
			name,
			payload,
			status: "pending",
			attempts: 0,
			priority,
			runAt: new Date(runAtMs),
			createdAt: timestamp,
			updatedAt: timestamp,
		};

		const sequence = this.sequence++;

		this.jobs.set(job.id, job);

		if (delayMs === 0) {
			this.ready.push({
				id: job.id,
				priority: job.priority,
				sequence,
			});
		} else {
			this.delayed.push({
				id: job.id,
				runAt: runAtMs,
				sequence,
			});
		}

		return this.copyJob(job);
	}

	dequeue(): Job<TPayload> | undefined {
		this.activatedDueJobs();

		const next = this.ready.peek();

		if (!next) {
			return undefined;
		}

		const job = this.requireJob(next.id);

		const updated = transitionJob(
			job,
			"processing",
			new Date(this.currentTime()),
		);

		this.ready.pop();
		this.jobs.set(job.id, updated);

		return this.copyJob(updated);
	}

	complete(id: string): Job<TPayload> {
		const job = this.requireJob(id);

		const updated = transitionJob(
			job,
			"completed",
			new Date(this.currentTime()),
		);

		this.jobs.set(id, updated);

		return this.copyJob(updated);
	}

	fail(id: string): Job<TPayload> {
		const job = this.requireJob(id);

		const updated = transitionJob(
			job,
			"failed",
			new Date(this.currentTime()),
		);

		this.jobs.set(id, updated);

		return this.copyJob(updated);
	}

	getJob(id: string): Job<TPayload> | undefined {
		const job = this.jobs.get(id);

		return job ? this.copyJob(job) : undefined;
	}

	private activatedDueJobs(): void {
		const nowMs = this.currentTime();

		while (true) {
			const next = this.delayed.peek();

			if (!next || next.runAt > nowMs) {
				break;
			}

			const job = this.requireJob(next.id);

			this.delayed.pop();

			this.ready.push({
				id: job.id,
				priority: job.priority,
				sequence: next.sequence,
			});
		}
	}

	private currentTime(): number {
		const time = this.now();

		if (
			!Number.isSafeInteger(time) ||
			!Number.isFinite(new Date(time).getTime())
		) {
			throw new RangeError("Clock returned an invalid timestamp");
		}

		return time;
	}

	private requireJob(id: string): Job<TPayload> {
		const job = this.jobs.get(id);

		if (!job) {
			throw new Error(`Job not found: ${id}`);
		}

		return job;
	}

	private copyJob(job: Job<TPayload>): Job<TPayload> {
		return {
			...job,
			runAt: new Date(job.runAt),
			createdAt: new Date(job.createdAt),
			updatedAt: new Date(job.updatedAt),
		};
	}
}
