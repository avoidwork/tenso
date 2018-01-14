module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON("package.json"),
		eslint: {
			target: [
				"*.js",
				"lib/*.js",
				"test/*.js",
				"www/assets/js/*.es6"
			]
		},
		mochaTest: {
			options: {
				reporter: "spec"
			},
			test: {
				src: ["test/*_test.js"/*, "test/*_test2.js"*/]
			}
		},
		nsp: {
			package: grunt.file.readJSON("package.json")
		},
		watch: {
			js: {
				files: ["*.js", "lib/*.js"],
				tasks: "default"
			}
		}
	});

	// tasks
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-mocha-test");
	grunt.loadNpmTasks("grunt-nsp");
	grunt.loadNpmTasks("grunt-contrib-watch");

	// aliases
	grunt.registerTask("mocha", ["mochaTest"]);
	grunt.registerTask("test", ["eslint", "mocha"]);
	grunt.registerTask("default", ["test"]);
};
