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

	// Date object tests
	it("should clone Date objects", () => {
		const date = new Date("2023-01-01T00:00:00.000Z");
		const cloned = clone(date);

		assert.ok(cloned instanceof Date);
		assert.strictEqual(cloned.getTime(), date.getTime());
		assert.notStrictEqual(cloned, date); // Different reference
	});

	it("should clone objects containing Date objects", () => {
		const obj = {
			created: new Date("2023-01-01T00:00:00.000Z"),
			updated: new Date("2023-12-31T23:59:59.999Z")
		};
		const cloned = clone(obj);

		assert.ok(cloned.created instanceof Date);
		assert.ok(cloned.updated instanceof Date);
		assert.strictEqual(cloned.created.getTime(), obj.created.getTime());
		assert.strictEqual(cloned.updated.getTime(), obj.updated.getTime());
		assert.notStrictEqual(cloned.created, obj.created);
		assert.notStrictEqual(cloned.updated, obj.updated);
	});

	// RegExp object tests
	it("should clone RegExp objects", () => {
		const regex = /test\d+/gi;
		const cloned = clone(regex);

		assert.ok(cloned instanceof RegExp);
		assert.strictEqual(cloned.source, regex.source);
		assert.strictEqual(cloned.flags, regex.flags);
		assert.notStrictEqual(cloned, regex); // Different reference
	});

	it("should clone objects containing RegExp objects", () => {
		const obj = {
			emailPattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
			phonePattern: /^\d{3}-\d{3}-\d{4}$/
		};
		const cloned = clone(obj);

		assert.ok(cloned.emailPattern instanceof RegExp);
		assert.ok(cloned.phonePattern instanceof RegExp);
		assert.strictEqual(cloned.emailPattern.source, obj.emailPattern.source);
		assert.strictEqual(cloned.phonePattern.source, obj.phonePattern.source);
		assert.notStrictEqual(cloned.emailPattern, obj.emailPattern);
		assert.notStrictEqual(cloned.phonePattern, obj.phonePattern);
	});

	// Map object tests
	it("should clone Map objects", () => {
		const map = new Map([
			["key1", "value1"],
			["key2", { nested: "object" }],
			[3, "number key"]
		]);
		const cloned = clone(map);

		assert.ok(cloned instanceof Map);
		assert.strictEqual(cloned.size, map.size);
		assert.strictEqual(cloned.get("key1"), "value1");
		assert.deepStrictEqual(cloned.get("key2"), { nested: "object" });
		assert.notStrictEqual(cloned.get("key2"), map.get("key2")); // Deep clone check
		assert.strictEqual(cloned.get(3), "number key");
		assert.notStrictEqual(cloned, map); // Different reference
	});

	it("should filter functions and undefined from Map objects", () => {
		const map = new Map([
			["valid", "value"],
			["func", () => {}],
			["undef", undefined],
			["another", "valid value"]
		]);
		const cloned = clone(map);

		assert.ok(cloned instanceof Map);
		assert.strictEqual(cloned.size, 2);
		assert.strictEqual(cloned.get("valid"), "value");
		assert.strictEqual(cloned.get("another"), "valid value");
		assert.strictEqual(cloned.has("func"), false);
		assert.strictEqual(cloned.has("undef"), false);
	});

	it("should clone empty Map objects", () => {
		const map = new Map();
		const cloned = clone(map);

		assert.ok(cloned instanceof Map);
		assert.strictEqual(cloned.size, 0);
		assert.notStrictEqual(cloned, map);
	});

	// Set object tests
	it("should clone Set objects", () => {
		const set = new Set([1, "hello", { nested: "object" }]);
		const cloned = clone(set);

		assert.ok(cloned instanceof Set);
		assert.strictEqual(cloned.size, set.size);
		assert.ok(cloned.has(1));
		assert.ok(cloned.has("hello"));

		// Check that nested objects are deep cloned
		const originalObject = Array.from(set).find(item => typeof item === "object");
		const clonedObject = Array.from(cloned).find(item => typeof item === "object");
		assert.deepStrictEqual(clonedObject, originalObject);
		assert.notStrictEqual(clonedObject, originalObject);
		assert.notStrictEqual(cloned, set); // Different reference
	});

	it("should filter functions and undefined from Set objects", () => {
		const set = new Set([
			"valid",
			() => {},
			undefined,
			42,
			"another valid"
		]);
		const cloned = clone(set);

		assert.ok(cloned instanceof Set);
		assert.strictEqual(cloned.size, 3);
		assert.ok(cloned.has("valid"));
		assert.ok(cloned.has(42));
		assert.ok(cloned.has("another valid"));
		assert.strictEqual(Array.from(cloned).some(item => typeof item === "function"), false);
		assert.strictEqual(cloned.has(undefined), false);
	});

	it("should clone empty Set objects", () => {
		const set = new Set();
		const cloned = clone(set);

		assert.ok(cloned instanceof Set);
		assert.strictEqual(cloned.size, 0);
		assert.notStrictEqual(cloned, set);
	});

	// Circular reference tests
	it("should handle circular references in objects", () => {
		const obj = { name: "test" };
		obj.self = obj; // Create circular reference

		const cloned = clone(obj);

		assert.strictEqual(cloned.name, "test");
		assert.strictEqual(cloned.self, cloned); // Should reference cloned object
		assert.notStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned.self, obj);
	});

	it("should handle circular references in arrays", () => {
		const arr = [1, 2];
		arr.push(arr); // Create circular reference

		const cloned = clone(arr);

		assert.strictEqual(cloned[0], 1);
		assert.strictEqual(cloned[1], 2);
		assert.strictEqual(cloned[2], cloned); // Should reference cloned array
		assert.notStrictEqual(cloned, arr);
	});

	it("should handle complex circular references", () => {
		const obj1 = { name: "obj1" };
		const obj2 = { name: "obj2" };
		obj1.ref = obj2;
		obj2.ref = obj1; // Create circular reference

		const cloned = clone(obj1);

		assert.strictEqual(cloned.name, "obj1");
		assert.strictEqual(cloned.ref.name, "obj2");
		assert.strictEqual(cloned.ref.ref, cloned); // Should reference cloned obj1
		assert.notStrictEqual(cloned, obj1);
		assert.notStrictEqual(cloned.ref, obj2);
	});

	it("should handle circular references with Maps", () => {
		const map = new Map();
		map.set("self", map); // Create circular reference
		map.set("data", "value");

		const cloned = clone(map);

		assert.ok(cloned instanceof Map);
		assert.strictEqual(cloned.get("data"), "value");
		assert.strictEqual(cloned.get("self"), cloned); // Should reference cloned map
		assert.notStrictEqual(cloned, map);
	});

	it("should handle circular references with Sets", () => {
		const set = new Set();
		set.add("value");
		set.add(set); // Create circular reference

		const cloned = clone(set);

		assert.ok(cloned instanceof Set);
		assert.ok(cloned.has("value"));
		assert.ok(cloned.has(cloned)); // Should contain reference to itself
		assert.notStrictEqual(cloned, set);
	});

	// Array edge cases
	it("should convert functions in arrays to null", () => {
		const arr = [1, () => {}, "hello", function named () {}];
		const cloned = clone(arr);

		assert.deepStrictEqual(cloned, [1, null, "hello", null]);
	});

	it("should convert undefined values in arrays to null", () => {
		const arr = [1, undefined, "hello", undefined, 3];
		const cloned = clone(arr);

		assert.deepStrictEqual(cloned, [1, null, "hello", null, 3]);
	});

	it("should handle mixed functions and undefined in arrays", () => {
		const arr = [1, undefined, () => {}, "valid", undefined, function () {}];
		const cloned = clone(arr);

		assert.deepStrictEqual(cloned, [1, null, null, "valid", null, null]);
	});

	// Custom class tests
	it("should return custom class instances as-is", () => {
		class CustomClass {
			constructor (value) {
				this.value = value;
			}
		}

		const instance = new CustomClass(42);
		const cloned = clone(instance);

		assert.strictEqual(cloned, instance); // Should be same reference
		assert.ok(cloned instanceof CustomClass);
		assert.strictEqual(cloned.value, 42);
	});

	it("should handle objects containing custom class instances", () => {
		class CustomClass {
			constructor (value) {
				this.value = value;
			}
		}

		const instance = new CustomClass(42);
		const obj = {
			data: "test",
			custom: instance,
			nested: { custom: instance }
		};
		const cloned = clone(obj);

		assert.strictEqual(cloned.data, "test");
		assert.strictEqual(cloned.custom, instance); // Same reference
		assert.strictEqual(cloned.nested.custom, instance); // Same reference
		assert.notStrictEqual(cloned, obj);
		assert.notStrictEqual(cloned.nested, obj.nested);
	});

	// Mixed collection tests
	it("should clone mixed collections with various data types", () => {
		const complexObj = {
			map: new Map([
				["date", new Date("2023-01-01")],
				["regex", /test/g],
				["nested", { value: 42 }]
			]),
			set: new Set([
				"string",
				123,
				new Date("2023-12-31"),
				{ id: 1 }
			]),
			array: [
				new Map([["key", "value"]]),
				new Set([1, 2, 3]),
				new Date("2023-06-15"),
				/pattern/i
			]
		};

		const cloned = clone(complexObj);

		// Verify structure
		assert.ok(cloned.map instanceof Map);
		assert.ok(cloned.set instanceof Set);
		assert.ok(Array.isArray(cloned.array));

		// Verify Map contents
		assert.ok(cloned.map.get("date") instanceof Date);
		assert.ok(cloned.map.get("regex") instanceof RegExp);
		assert.deepStrictEqual(cloned.map.get("nested"), { value: 42 });
		assert.notStrictEqual(cloned.map.get("nested"), complexObj.map.get("nested"));

		// Verify Set contents
		assert.ok(cloned.set.has("string"));
		assert.ok(cloned.set.has(123));
		const clonedSetDate = Array.from(cloned.set).find(item => item instanceof Date);
		const originalSetDate = Array.from(complexObj.set).find(item => item instanceof Date);
		assert.ok(clonedSetDate instanceof Date);
		assert.notStrictEqual(clonedSetDate, originalSetDate);

		// Verify Array contents
		assert.ok(cloned.array[0] instanceof Map);
		assert.ok(cloned.array[1] instanceof Set);
		assert.ok(cloned.array[2] instanceof Date);
		assert.ok(cloned.array[3] instanceof RegExp);

		// Verify all are different references
		assert.notStrictEqual(cloned, complexObj);
		assert.notStrictEqual(cloned.map, complexObj.map);
		assert.notStrictEqual(cloned.set, complexObj.set);
		assert.notStrictEqual(cloned.array, complexObj.array);
	});

	// Edge cases
	it("should handle undefined as input", () => {
		const result = clone(undefined);
		assert.strictEqual(result, undefined);
	});

	it("should handle function as input", () => {
		const func = () => {};
		const result = clone(func);
		assert.strictEqual(result, func);
	});

	it("should handle symbol as input", () => {
		const sym = Symbol("test");
		const result = clone(sym);
		assert.strictEqual(result, sym);
	});

	it("should handle deeply nested structures with all data types", () => {
		const deepObj = {
			level1: {
				level2: {
					level3: {
						map: new Map([["deep", "value"]]),
						set: new Set([new Date()]),
						array: [/regex/, { final: "level" }],
						date: new Date(),
						circular: null // Will be set after creation
					}
				}
			}
		};

		// Create circular reference
		deepObj.level1.level2.level3.circular = deepObj;

		const cloned = clone(deepObj);

		// Verify deep structure is cloned
		assert.notStrictEqual(cloned.level1, deepObj.level1);
		assert.notStrictEqual(cloned.level1.level2, deepObj.level1.level2);
		assert.notStrictEqual(cloned.level1.level2.level3, deepObj.level1.level2.level3);

		// Verify circular reference is maintained in clone
		assert.strictEqual(cloned.level1.level2.level3.circular, cloned);

		// Verify all data types are properly cloned
		const clonedLevel3 = cloned.level1.level2.level3;
		assert.ok(clonedLevel3.map instanceof Map);
		assert.ok(clonedLevel3.set instanceof Set);
		assert.ok(Array.isArray(clonedLevel3.array));
		assert.ok(clonedLevel3.date instanceof Date);
	});
});
