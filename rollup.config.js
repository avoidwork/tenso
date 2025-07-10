import {createRequire} from "node:module";

const require = createRequire(import.meta.url);
const pkg = require("./package.json");
const year = new Date().getFullYear();
const bannerLong = `/**
 * ${pkg.name}
 *
 * @copyright ${year} ${pkg.author}
 * @license ${pkg.license}
 * @version ${pkg.version}
 */`;
const defaultOutBase = {compact: true, banner: bannerLong, name: pkg.name};
const cjOutBase = {...defaultOutBase, compact: false, format: "cjs", exports: "named"};
const esmOutBase = {...defaultOutBase, format: "esm"};

export default [
	{
		input: `./src/${pkg.name}.js`,
		output: [
			{
				...cjOutBase,
				file: `dist/${pkg.name}.cjs`
			},
			{
				...esmOutBase,
				file: `dist/${pkg.name}.js`
			}
		],
		external: [
			"node:crypto",
			"node:fs",
			"node:module",
			"node:path",
			"node:url",
			"woodland",
			"tiny-eventsource",
			"node:http",
			"node:https",
			"tiny-coerce",
			"yamljs",
			"url",
			"keysort",
			"cookie-parser",
			"redis",
			"express-session",
			"passport",
			"passport-http",
			"passport-http-bearer",
			"passport-local",
			"passport-oauth2",
			"passport-jwt",
			"ioredis",
			"csv-stringify/sync",
			"fast-xml-parser",
			"tiny-jsonl",
			"helmet",
			"connect-redis",
			"tiny-merge",
			"express-prom-bundle"
		]
	}
];
