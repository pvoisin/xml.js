module.exports = function(grunt) {
	grunt.initConfig({
		mochaTest: {
			options: {
				reporter: "spec"
			},
			test: {
				src: ["test/**/*Suite.js"]
			}
		}
	});

	var modules = [
		"grunt-mocha-test"
	];

	modules.forEach(function(module) {
		grunt.loadNpmTasks(module);
	});

	grunt.registerTask("test", ["mochaTest"]);
};
