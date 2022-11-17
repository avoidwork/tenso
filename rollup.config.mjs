import pkg from "./package.json" assert {type: "json"};
import terser from '@rollup/plugin-terser';

const year = new Date().getFullYear();
const bannerLong = `/**
 * ${pkg.name}
 *
 * @copyright ${year} ${pkg.author}
 * @license ${pkg.license}
 * @version ${pkg.version}
 */`;
const bannerShort = `/*!
 ${year} ${pkg.author}
 @version ${pkg.version}
*/`;
const defaultOutBase = {compact: true, banner: bannerLong, name: pkg.name};
const cjOutBase = {...defaultOutBase, compact: false, format: "cjs", exports: "named"};
const esmOutBase = {...defaultOutBase, format: "esm"};
const minOutBase = {banner: bannerShort, name: pkg.name, plugins: [terser()], sourcemap: true};

export default {
	external: [
		"node:http",
		"node:path",
		"node:events",
		"node:fs",
		"node:url",
		"mime-db",
		"precise",
		"tiny-etag",
		"tiny-lru",
		"tiny-coerce"
	],
	input: `./src/${pkg.name}.js`,
	output: [
		{
			...cjOutBase,
			file: `dist/${pkg.name}.cjs`
		},
		{
			...esmOutBase,
			file: `dist/${pkg.name}.esm.js`
		},
		{
			...esmOutBase,
			...minOutBase,
			file: `dist/${pkg.name}.esm.min.js`
		}
	]
};
