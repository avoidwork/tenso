module.exports = function (grunt) {
	grunt.initConfig({
		pkg : grunt.file.readJSON("package.json"),
		babel: {
			options: {
				sourceMap: false,
				presets: ["babel-preset-es2015"]
			},
			dist: {
				files: [{
					expand: true,
					cwd: 'src',
					src: ['*.js'],
					dest: 'lib',
					ext: '.js'
				}]
			}
		},
		eslint: {
			target: ["src/*.js"]
		},
		mochaTest : {
			options: {
				reporter: "spec"
			},
			test : {
				src : ["test/*_test.js"]
			}
		},
		nsp: {
			package: grunt.file.readJSON("package.json")
		},
		sass: {
			dist: {
				options : {
					style : "compressed"
				},
				files : {
					"www/css/style.css" : "sass/style.scss"
				}
			}
		},
		sed : {
			version : {
				pattern : "{{VERSION}}",
				replacement : "<%= pkg.version %>",
				path : ["lib/renderers.js", "lib/tenso.js", "lib/utility.js"]
			}
		},
		watch : {
			js : {
				files : ["lib/*.js"],
				tasks : "build"
			},
			pkg: {
				files : "package.json",
				tasks : "build"
			},
			readme : {
				files : "README.md",
				tasks : "build"
			},
			sass: {
				files : "sass/style.scss",
				tasks : "build"
			}
		}
	});

	// tasks
	grunt.loadNpmTasks("grunt-babel");
	grunt.loadNpmTasks("grunt-eslint");
	grunt.loadNpmTasks("grunt-mocha-test");
	grunt.loadNpmTasks("grunt-nsp");
	grunt.loadNpmTasks("grunt-sed");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-sass");

	// aliases
	grunt.registerTask("test", ["eslint", "mochaTest", "nsp"]);
	grunt.registerTask("build", ["sass", "babel", "sed"]);
	grunt.registerTask("default", ["sass", "eslint", "babel", "sed", "mochaTest", "nsp"]);
};
