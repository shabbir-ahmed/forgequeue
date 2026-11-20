export class BinaryHeap<T> {
	private readonly items: T[] = [];

	constructor(private readonly compare: (a: T, b: T) => number) {}

	get size(): number {
		return this.items.length;
	}

	peek(): T | undefined {
		return this.items[0];
	}

	push(value: T): void {
		this.items.push(value);

		let index = this.items.length - 1;

		while (index > 0) {
			const parent = Math.floor((index - 1) / 2);

			if (this.compare(this.items[index]!, this.items[parent]!) >= 0) {
				break;
			}

			this.swap(index, parent);
			index = parent;
		}
	}

	pop(): T | undefined {
		if (this.items.length === 0) {
			return undefined;
		}

		const top = this.items[0]!;
		const last = this.items.pop()!;

		if (this.items.length > 0) {
			this.items[0] = last;
			this.siftDown(0);
		}

		return top;
	}

	private siftDown(start: number): void {
		let index = start;

		while (true) {
			const left = 2 * index + 1;
			const right = left + 1;
			let best = index;

			if (
				left < this.items.length &&
				this.compare(this.items[left]!, this.items[best]!) < 0
			) {
				best = left;
			}

			if (
				right < this.items.length &&
				this.compare(this.items[right]!, this.items[best]!) < 0
			) {
				best = right;
			}

			if (best === index) {
				break;
			}

			this.swap(index, best);
			index = best;
		}
	}

	private swap(a: number, b: number): void {
		const value = this.items[a]!;

		this.items[a] = this.items[b]!;
		this.items[b] = value;
	}
}
