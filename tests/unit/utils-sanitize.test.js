import assert from "node:assert";
import { sanitize } from "../../src/utils/sanitize.js";

describe("sanitize", () => {
	it("should escape < and > characters in strings", () => {
		assert.strictEqual(sanitize("<script>"), "&lt;script&gt;");
		assert.strictEqual(sanitize("<div>"), "&lt;div&gt;");
		assert.strictEqual(sanitize("<p>hello</p>"), "&lt;p&gt;hello&lt;/p&gt;");
	});

	it("should escape only < character", () => {
		assert.strictEqual(sanitize("<hello"), "&lt;hello");
		assert.strictEqual(sanitize("< world"), "&lt; world");
	});

	it("should escape only > character", () => {
		assert.strictEqual(sanitize("hello>"), "hello&gt;");
		assert.strictEqual(sanitize("world >"), "world &gt;");
	});

	it("should handle strings without HTML characters", () => {
		assert.strictEqual(sanitize("hello world"), "hello world");
		assert.strictEqual(sanitize("test string"), "test string");
		assert.strictEqual(sanitize("12345"), "12345");
	});

	it("should handle empty strings", () => {
		assert.strictEqual(sanitize(""), "");
	});

	it("should handle strings with multiple HTML characters", () => {
		assert.strictEqual(sanitize("<<<>>>"), "&lt;&lt;&lt;&gt;&gt;&gt;");
		assert.strictEqual(sanitize("<><><>"), "&lt;&gt;&lt;&gt;&lt;&gt;");
	});

	it("should handle HTML tags mixed with text", () => {
		assert.strictEqual(sanitize("Hello <b>world</b>!"), "Hello &lt;b&gt;world&lt;/b&gt;!");
		assert.strictEqual(sanitize("Click <a href='#'>here</a>"), "Click &lt;a href='#'&gt;here&lt;/a&gt;");
	});

	it("should return non-strings unchanged", () => {
		assert.strictEqual(sanitize(123), 123);
		assert.strictEqual(sanitize(true), true);
		assert.strictEqual(sanitize(false), false);
		assert.strictEqual(sanitize(null), null);
		assert.strictEqual(sanitize(undefined), undefined);
	});

	it("should handle objects", () => {
		const obj = { key: "value" };
		assert.strictEqual(sanitize(obj), obj);
	});

	it("should handle arrays", () => {
		const arr = [1, 2, 3];
		assert.strictEqual(sanitize(arr), arr);
	});

	it("should handle functions", () => {
		const func = () => {};
		assert.strictEqual(sanitize(func), func);
	});

	it("should handle complex HTML strings", () => {
		const html = "<script>alert('xss')</script>";
		const expected = "&lt;script&gt;alert('xss')&lt;/script&gt;";
		assert.strictEqual(sanitize(html), expected);
	});

	it("should handle self-closing tags", () => {
		assert.strictEqual(sanitize("<br/>"), "&lt;br/&gt;");
		assert.strictEqual(sanitize("<img src='test.jpg'/>"), "&lt;img src='test.jpg'/&gt;");
	});

	it("should handle nested tags", () => {
		const html = "<div><p><span>text</span></p></div>";
		const expected = "&lt;div&gt;&lt;p&gt;&lt;span&gt;text&lt;/span&gt;&lt;/p&gt;&lt;/div&gt;";
		assert.strictEqual(sanitize(html), expected);
	});

	it("should handle special characters mixed with HTML", () => {
		assert.strictEqual(sanitize("hello < world & test >"), "hello &lt; world & test &gt;");
	});

	it("should handle numbers as strings", () => {
		assert.strictEqual(sanitize("123"), "123");
		assert.strictEqual(sanitize("0"), "0");
		assert.strictEqual(sanitize("-45"), "-45");
	});

	it("should handle dates", () => {
		const date = new Date();
		assert.strictEqual(sanitize(date), date);
	});

	it("should handle symbols", () => {
		const sym = Symbol("test");
		assert.strictEqual(sanitize(sym), sym);
	});
});
