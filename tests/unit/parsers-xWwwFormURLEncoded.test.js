import assert from "node:assert";
import {describe, it} from "mocha";
import {xWwwFormURLEncoded} from "../../src/parsers/xWwwFormURLEncoded.js";

/**
 * Unit tests for x-www-form-urlencoded parser module
 */
describe("parsers/xWwwFormURLEncoded", () => {
	describe("xWwwFormURLEncoded()", () => {
		it("should parse simple key-value pairs", () => {
			const input = "name=John&age=30&active=true";
			const expected = {
				name: "John",
				age: 30,
				active: true
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle URL-encoded characters", () => {
			const input = "message=Hello%20World&special=%21%40%23%24";
			const expected = {
				message: "Hello World",
				special: "!@#$"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle plus signs as spaces", () => {
			const input = "message=Hello+World&name=John+Doe";
			const expected = {
				message: "Hello World",
				name: "John Doe"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should coerce numeric values", () => {
			const input = "id=123&price=45.99&count=0&negative=-10";
			const expected = {
				id: 123,
				price: 45.99,
				count: 0,
				negative: -10
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should coerce boolean values", () => {
			const input = "active=true&disabled=false&enabled=1&hidden=0";
			const expected = {
				active: true,
				disabled: false,
				enabled: 1,
				hidden: 0
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle empty values", () => {
			const input = "name=John&empty=&another=value";
			const expected = {
				name: "John",
				empty: "",
				another: "value"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should return empty object for empty string", () => {
			const result = xWwwFormURLEncoded("");
			assert.deepStrictEqual(result, {});
		});

		it("should return empty object for null input", () => {
			const result = xWwwFormURLEncoded(null);
			assert.deepStrictEqual(result, {});
		});

		it("should return empty object for undefined input", () => {
			const result = xWwwFormURLEncoded(undefined);
			assert.deepStrictEqual(result, {});
		});

		it("should handle single key-value pair", () => {
			const input = "name=John";
			const expected = {name: "John"};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should skip malformed pairs without equals sign", () => {
			const input = "name=John&invalidpair&age=30";
			const expected = {
				name: "John",
				age: 30
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle encoded keys", () => {
			const input = "user%5Bname%5D=John&user%5Bage%5D=30";
			const expected = {
				"user[name]": "John",
				"user[age]": 30
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle special characters in values", () => {
			const input = "email=user%40example.com&path=%2Fhome%2Fuser&query=a%3Db%26c%3Dd";
			const expected = {
				email: "user@example.com",
				path: "/home/user",
				query: "a=b&c=d"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle unicode characters", () => {
			const input = "name=%E4%B8%96%E7%95%8C&emoji=%F0%9F%8C%8D";
			const expected = {
				name: "世界",
				emoji: "🌍"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle multiple equals signs in value", () => {
			const input = "equation=x%3D2%2By%3D5&result=x%3D%3D%3D7";
			const expected = {
				equation: "x=2+y=5",
				result: "x===7"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle ampersands in encoded values", () => {
			const input = "query=a%26b%26c&params=x%3D1%26y%3D2";
			const expected = {
				query: "a&b&c",
				params: "x=1&y=2"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle array-like parameter names", () => {
			const input = "items%5B0%5D=first&items%5B1%5D=second&items%5B2%5D=third";
			const expected = {
				"items[0]": "first",
				"items[1]": "second",
				"items[2]": "third"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle complex form data", () => {
			const input = "user%5Bprofile%5D%5Bname%5D=John+Doe&user%5Bprofile%5D%5Bage%5D=30&user%5Bactive%5D=true&tags%5B%5D=admin&tags%5B%5D=user";
			// Since the parser overwrites duplicate keys, we expect only the last value
			const expected = {
				"user[profile][name]": "John Doe",
				"user[profile][age]": 30,
				"user[active]": true,
				"tags[]": "user"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});

		it("should handle keys and values with spaces correctly", () => {
			const input = "full+name=John+Doe&description=A+very+long+description+with+spaces";
			const expected = {
				"full name": "John Doe",
				description: "A very long description with spaces"
			};
			const result = xWwwFormURLEncoded(input);

			assert.deepStrictEqual(result, expected);
		});
	});
});
