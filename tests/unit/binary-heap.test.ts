import { describe, expect, it } from "vitest";

import { BinaryHeap } from "../../packages/core/src/structures/binary-heap.js";

describe("BinaryHeap", () => {
	it("returns values in ascending order", () => {
		const heap = new BinaryHeap<number>((a, b) => a - b);

		heap.push(5);
		heap.push(1);
		heap.push(9);
		heap.push(3);

		expect(heap.pop()).toBe(1);
		expect(heap.pop()).toBe(3);
		expect(heap.pop()).toBe(5);
		expect(heap.pop()).toBe(9);
	});

	it("handles an empty heap", () => {
		const heap = new BinaryHeap<number>((a, b) => a - b);

		expect(heap.peek()).toBeUndefined();
		expect(heap.pop()).toBeUndefined();
		expect(heap.size).toBe(0);
	});

	it("supports custom priority ordering", () => {
		const heap = new BinaryHeap<number>((a, b) => b - a);

		heap.push(2);
		heap.push(10);
		heap.push(5);

		expect(heap.peek()).toBe(10);
		expect(heap.pop()).toBe(10);
		expect(heap.pop()).toBe(5);
		expect(heap.pop()).toBe(2);
	});
});
