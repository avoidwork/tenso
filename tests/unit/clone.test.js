import assert from "node:assert";
import { clone } from "../../src/utils/clone.js";

describe("clone", () => {
	it("should clone primitive values", () => {
		assert.strictEqual(clone(42), 42);
		assert.strictEqual(clone("hello"), "hello");
		assert.strictEqual(clone(true), true);
		assert.strictEqual(clone(null), null);
	});

	it("should clone simple objects", () => {
		const obj = { a: 1, b: 2 };
		const cloned = clone(obj);

		assert.deepStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned, obj); // Different reference
	});

	it("should clone nested objects", () => {
		const obj = { a: { b: { c: 1 } } };
		const cloned = clone(obj);

		assert.deepStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned.a, obj.a);
		assert.notStrictEqual(cloned.a.b, obj.a.b);
	});

	it("should clone arrays", () => {
		const arr = [1, 2, 3];
		const cloned = clone(arr);

		assert.deepStrictEqual(cloned, arr);
		assert.notStrictEqual(cloned, arr);
	});

	it("should clone nested arrays", () => {
		const arr = [[1, 2], [3, 4]];
		const cloned = clone(arr);

		assert.deepStrictEqual(cloned, arr);
		assert.notStrictEqual(cloned, arr);
		assert.notStrictEqual(cloned[0], arr[0]);
	});

	it("should clone objects with arrays", () => {
		const obj = { list: [1, 2, 3], name: "test" };
		const cloned = clone(obj);

		assert.deepStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned.list, obj.list);
	});

	it("should clone arrays with objects", () => {
		const arr = [{ id: 1 }, { id: 2 }];
		const cloned = clone(arr);

		assert.deepStrictEqual(cloned, arr);
		assert.notStrictEqual(cloned, arr);
		assert.notStrictEqual(cloned[0], arr[0]);
	});

	it("should clone complex nested structures", () => {
		const obj = {
			user: {
				id: 1,
				name: "John",
				hobbies: ["reading", "gaming"],
				address: {
					street: "123 Main St",
					city: "Anytown"
				}
			},
			items: [
				{ id: 1, name: "item1" },
				{ id: 2, name: "item2" }
			]
		};
		const cloned = clone(obj);

		assert.deepStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned.user, obj.user);
		assert.notStrictEqual(cloned.user.hobbies, obj.user.hobbies);
		assert.notStrictEqual(cloned.items, obj.items);
		assert.notStrictEqual(cloned.items[0], obj.items[0]);
	});

	it("should handle empty objects", () => {
		const obj = {};
		const cloned = clone(obj);

		assert.deepStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned, obj);
	});

	it("should handle empty arrays", () => {
		const arr = [];
		const cloned = clone(arr);

		assert.deepStrictEqual(cloned, arr);
		assert.notStrictEqual(cloned, arr);
	});

	it("should not clone functions (functions are not JSON serializable)", () => {
		const obj = { func: () => {} };
		const cloned = clone(obj);

		assert.deepStrictEqual(cloned, {});
	});

	it("should not clone undefined values", () => {
		const obj = { a: undefined, b: 1 };
		const cloned = clone(obj);

		assert.deepStrictEqual(cloned, { b: 1 });
	});
});
