export const serializers = new Map([
	[
		"application/x-www-form-urlencoded",
		arg => arg
	],
	[
		"application/json",
		arg => JSON.parse(arg)
	]
]);
