import globals from "globals";
import pluginJs from "@eslint/js";

export default [
	{languageOptions: {globals: {...globals.browser, ...globals.node, it: true, describe: true}}},
	pluginJs.configs.recommended,
];