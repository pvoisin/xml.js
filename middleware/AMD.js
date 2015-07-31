(function(global) {
	function factory(/*%DEP_IMPL%*/) {
		var module /* = %MOD_IMPL% */;

		return module;
	}

	var AMD = (typeof define === "function") && define.amd;

	if(!AMD) {
		var resolver = {
			// ...: ...
		};

		global["define"] = function(modules, callback) {
			return callback.apply(this, modules.map(function(module) {
				return resolver[module] || global[module];
			}));
		}
	}

	var module = define([/*%DEP_DECL%*/], factory);

	if(!AMD) {
		global["%MOD_ALIAS%"] = module;
	}
})(window);