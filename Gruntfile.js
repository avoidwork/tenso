module.exports = function (grunt) {
	grunt.initConfig({
		eslint: {
			target: [
				"*.js",
				"lib/*.js",
				"test/*.js",
				"www/assets/js/app.js"
			]
		},
		mochaTest: {
			options: {
				reporter: "spec"
			},
			test: {
				src: [
					"test/*_test.js",
					"test/*_test2.js"
				]
			}
		}
	});

	// tasks
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-mocha-test");

	// aliases
	grunt.registerTask("mocha", ["mochaTest"]);
	grunt.registerTask("test", ["eslint", "mocha"]);
	grunt.registerTask("default", ["test"]);
};
