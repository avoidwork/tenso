import assert from "node:assert";
import { sort } from "../../src/utils/sort.js";

describe("sort", () => {
	it("should return original data when no order_by parameter", () => {
		const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
		const req = {
			parsed: {
				search: "",
				searchParams: new URLSearchParams("")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, data);
		assert.notStrictEqual(result, data); // Should be a clone
	});

	it("should sort by single property", () => {
		const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
		const req = {
			parsed: {
				search: "?order_by=id",
				searchParams: new URLSearchParams("order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, [{ id: 1 }, { id: 2 }, { id: 3 }]);
	});

	it("should sort by multiple properties", () => {
		const data = [
			{ name: "John", age: 30 },
			{ name: "Jane", age: 25 },
			{ name: "Bob", age: 30 }
		];
		const req = {
			parsed: {
				search: "?order_by=age&order_by=name",
				searchParams: new URLSearchParams("order_by=age&order_by=name")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, [
			{ name: "Jane", age: 25 },
			{ name: "Bob", age: 30 },
			{ name: "John", age: 30 }
		]);
	});

	it("should reverse sort when order_by=desc", () => {
		const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
		const req = {
			parsed: {
				search: "?order_by=id&order_by=desc",
				searchParams: new URLSearchParams("order_by=id&order_by=desc")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, [{ id: 3 }, { id: 2 }, { id: 1 }]);
	});

	it("should handle empty arrays", () => {
		const data = [];
		const req = {
			parsed: {
				search: "?order_by=id",
				searchParams: new URLSearchParams("order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, []);
	});

	it("should not sort primitive arrays", () => {
		const data = [3, 1, 2];
		const req = {
			parsed: {
				search: "?order_by=id",
				searchParams: new URLSearchParams("order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, [3, 1, 2]);
	});

	it("should not sort boolean arrays", () => {
		const data = [true, false, true];
		const req = {
			parsed: {
				search: "?order_by=id",
				searchParams: new URLSearchParams("order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, [true, false, true]);
	});

	it("should not sort string arrays", () => {
		const data = ["c", "a", "b"];
		const req = {
			parsed: {
				search: "?order_by=id",
				searchParams: new URLSearchParams("order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, ["c", "a", "b"]);
	});

	it("should not sort arrays with null elements", () => {
		const data = [null, null, null];
		const req = {
			parsed: {
				search: "?order_by=id",
				searchParams: new URLSearchParams("order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, [null, null, null]);
	});

	it("should not sort arrays with undefined elements", () => {
		const data = [undefined, undefined, undefined];
		const req = {
			parsed: {
				search: "?order_by=id",
				searchParams: new URLSearchParams("order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, [undefined, undefined, undefined]);
	});

	it("should handle non-array data", () => {
		const data = { id: 1, name: "test" };
		const req = {
			parsed: {
				search: "?order_by=id",
				searchParams: new URLSearchParams("order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, data);
		assert.notStrictEqual(result, data); // Should be a clone
	});

	it("should handle missing parsed property", () => {
		const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
		const req = {};

		const result = sort(data, req);
		assert.deepStrictEqual(result, data);
	});

	it("should handle missing search property", () => {
		const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
		const req = {
			parsed: {}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, data);
	});

	it("should handle missing searchParams property", () => {
		const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
		const req = {
			parsed: {
				search: "?order_by=id"
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, data);
	});

	it("should filter out 'desc' from order_by keys", () => {
		const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
		const req = {
			parsed: {
				search: "?order_by=desc&order_by=id",
				searchParams: new URLSearchParams("order_by=desc&order_by=id")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, [{ id: 1 }, { id: 2 }, { id: 3 }]);
	});

	it("should handle complex nested objects", () => {
		const data = [
			{ user: { name: "John", age: 30 } },
			{ user: { name: "Jane", age: 25 } },
			{ user: { name: "Bob", age: 35 } }
		];
		const req = {
			parsed: {
				search: "?order_by=user.age",
				searchParams: new URLSearchParams("order_by=user.age")
			}
		};

		const result = sort(data, req);
		// keysort should handle nested property sorting
		assert.strictEqual(result.length, 3);
	});

	it("should handle empty order_by values", () => {
		const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
		const req = {
			parsed: {
				search: "?order_by=",
				searchParams: new URLSearchParams("order_by=")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, data);
	});

	it("should handle multiple empty order_by values", () => {
		const data = [{ id: 3 }, { id: 1 }, { id: 2 }];
		const req = {
			parsed: {
				search: "?order_by=&order_by=",
				searchParams: new URLSearchParams("order_by=&order_by=")
			}
		};

		const result = sort(data, req);
		assert.deepStrictEqual(result, data);
	});
});
