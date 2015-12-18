module.exports = function (grunt) {
	grunt.initConfig({
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
				path : ["<%= concat.dist.dest %>"]
			}
		},
		watch : {
			js : {
				files : "<%= concat.dist.src %>",
				tasks : "default"
			},
			pkg: {
				files : "package.json",
				tasks : "default"
			},
			readme : {
				files : "README.md",
				tasks : "default"
			},
			sass: {
				files : "sass/style.scss",
				tasks : "default"
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
	grunt.registerTask("default", ["sass", "eslint", "babel", "mochaTest", "nsp"]);
};
