module.exports = function(grunt) {
	grunt.initConfig({
		uglify: {
			build: {
				options: {
					sourceMap: true,
					sourceMapName: "distribution/ytility.js.map"
				},
				files: {
					"distribution/ytility.js": ["source/ytility.js"]
				}
			}
		},

		connect: {
			options: {
				hostname: "*",
				base: ".",
				keepalive: true,
				port: 8080
			},

			development: {
			},

			test:  {
				options: {
					keepalive: false,
					port: 8888
				}
			}
		},

		mocha: {
			test: {
				options: {
					urls: ["http://localhost:8888/test/framework/runner.html"]
				}
			}
		}
	});

	grunt.registerTask("build", ["uglify:build"]);
	grunt.registerTask("server", ["connect:development"]);
	grunt.registerTask("test", ["connect:test", "mocha"]);

	grunt.registerTask("default", ["build"]);

	grunt.loadNpmTasks("grunt-contrib-uglify");
	grunt.loadNpmTasks("grunt-contrib-connect");
	grunt.loadNpmTasks("grunt-mocha");
};