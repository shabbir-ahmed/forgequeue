import { randomUUID } from "node:crypto";

import type { Job } from "../types/job.ts";
import { transitionJob } from "./state-machine.js";

export class QueueEngine<TPayload> {
	private readonly jobs = new Map<string, Job<TPayload>>();

	private readonly pendingJobIds: string[] = [];

	enqueue(name: string, payload: TPayload): Job<TPayload> {
		if (!name.trim()) {
			throw new Error("Job name cannot be empty");
		}

		const now = new Date();

		const job: Job<TPayload> = {
			id: randomUUID(),
			name,
			payload,
			status: "pending",
			attempts: 0,
			createdAt: now,
			updatedAt: now,
		};

		this.jobs.set(job.id, job);
		this.pendingJobIds.push(job.id);

		return this.copyJob(job);
	}

	dequeue(): Job<TPayload> | undefined {
		const id = this.pendingJobIds.shift();

		if (id === undefined) {
			return undefined;
		}

		const job = this.jobs.get(id);

		if (!job) {
			throw new Error(`Job not found: ${id}`);
		}

		const updatedJob = transitionJob(job, "processing");

		this.jobs.set(id, updatedJob);

		return this.copyJob(updatedJob);
	}

	complete(id: string): Job<TPayload> {
		const job = this.requireJob(id);

		const updatedJob = transitionJob(job, "completed");

		this.jobs.set(id, updatedJob);

		return this.copyJob(updatedJob);
	}

	fail(id: string): Job<TPayload> {
		const job = this.requireJob(id);

		const updatedJob = transitionJob(job, "failed");

		this.jobs.set(id, updatedJob);

		return this.copyJob(updatedJob);
	}

	getJob(id: string): Job<TPayload> | undefined {
		const job = this.jobs.get(id);

		return job ? this.copyJob(job) : undefined;
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
			createdAt: new Date(job.createdAt),
			updatedAt: new Date(job.updatedAt),
		};
	}
}
