module.exports = function (grunt) {
	grunt.initConfig({
		pkg : grunt.file.readJSON("package.json"),
		concat : {
			options : {
				banner : "/**\n" +
				         " * <%= pkg.description %>\n" +
				         " *\n" +
				         " * @author <%= pkg.author.name %> <<%= pkg.author.email %>>\n" +
				         " * @copyright <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>\n" +
				         " * @license <%= pkg.licenses[0].type %> <<%= pkg.licenses[0].url %>>\n" +
				         " * @link <%= pkg.homepage %>\n" +
				         " * @module <%= pkg.name %>\n" +
				         " * @version <%= pkg.version %>\n" +
				         " */\n"
			},
			dist : {
				src : [
					"src/intro.js",
					"src/regex.js",
					"src/constructor.js",
					"src/auth.js",
					"src/bootstrap.js",
					"src/error.js",
					"src/factory.js",
					"src/hypermedia.js",
					"src/keymaster.js",
					"src/prepare.js",
					"src/rate.js",
					"src/response.js",
					"src/zuul.js",
					"src/outro.js"
				],
				dest : "lib/<%= pkg.name %>.es6.js"
			}
		},
		"6to5": {
			options: {
				sourceMap: false
			},
			dist: {
				files: {
					"lib/<%= pkg.name %>.js": "lib/<%= pkg.name %>.es6.js"
				}
			}
		},
		jsdoc : {
			dist : {
				src: ["lib/<%= pkg.name %>.js", "README.md"],
				options: {
				    destination : "doc",
				    template    : "node_modules/ink-docstrap/template",
				    configure   : "docstrap.json",
				    "private"   : false
				}
			}
		},
		mochaTest : {
			options: {
				reporter: "spec"
			},
			test : {
				src : ["test/*_test.js"]
			}
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
	grunt.loadNpmTasks("grunt-sed");
	grunt.loadNpmTasks("grunt-jsdoc");
	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-watch");
	grunt.loadNpmTasks("grunt-contrib-sass");
	grunt.loadNpmTasks("grunt-mocha-test");
	grunt.loadNpmTasks("grunt-nsp-package");
	grunt.loadNpmTasks("grunt-6to5");

	// aliases
	grunt.registerTask("build", ["concat", "sed", "sass"]);
	grunt.registerTask("test", ["mochaTest"]);
	grunt.registerTask("default", ["build", "6to5", "test"]);
	grunt.registerTask("validate", "validate-package");
	grunt.registerTask("package", ["validate", "default", "jsdoc"]);
};
