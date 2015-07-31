(function(global) {
	function factory(XPath) {
		var XML = {
			declaration: "<?xml version=\"1.1\" encoding=\"UTF-8\"?>",

			/**
			 * @param {String} text XML text to parse.
			 * @return {Document}
			 */
			parse: function parse(text) {
				var parser = new DOMParser();
				return parser.parseFromString(text, "text/xml");
			},

			/**
			 * @param {String}   locator     Locator of the XML file to load.
			 * @param {Function} callback    Function to be called when the file is loaded.
			 * @return {Document}
			 */
			load: function load(locator, callback) {
				var request = new XMLHttpRequest();

				request.open("GET", String(locator), true);

				request.onreadystatechange = function() {
					if(request.readyState == 4) {
						if(request.status < 100 || request.status >= 400) {
							callback && callback(new Error("Failed (" + request.status + ")!"));
						}
						else {
							try {
								var document = XML.parse(request.responseText);
							}
							catch(error) {
								var caught = true;
								callback && callback(error);
							}

							!caught && callback && callback(null, document);
						}
					}
				};

				request.send();

				return request;
			},

			/**
			 * @param {Node} node XML node to serialize.
			 * @return {String}
			 */
			serialize: function serialize(node) {
				var serializer = new XMLSerializer();
				return serializer.serializeToString(node);
			},

			/**
			 * @param {Node}   node       Node to evaluate the expression against.
			 * @param {String} expression X-Path expression to evaluate.
			 * @param {Object} [resolver] Simple URI resolver, like: `{"prefix": "http://...", ...}`.
			 *    Default namespace may be specified with the empty key: "".
			 * @return {Array} X-Path evaluation results.
			 */
			query: function query(node, expression, resolver) {
				return XPath.evaluate(node, expression, resolver);
			},

			/**
			 * Only for Internet Explorer...
			 * Converts the provided document into the DOM implementation that works with XPath.

			 * @param {Document} document Document to convert.
			 * @return {Document}
			 */
			fix: function fix(document) {
				var result = document;

				// See http://stackoverflow.com/a/19639035/1203332
				if("ActiveXObject" in global) {
					var serializer = new XMLSerializer();
					var fragment = serializer.serializeToString(document);
					result = new ActiveXObject("Microsoft.XMLDOM");
					result.async = false;
					result.loadXML(fragment);
				}

				return result;
			}
		};

		return XML;
	}

	var AMD = (typeof define === "function") && define.amd;

	if(!AMD) {
		global["define"] = function(modules, callback) {
			return callback.apply(this, modules.map(function(module) {
				return global[module];
			}));
		}
	}

	var module = define(["XPath"], factory);

	if(!AMD) {
		global.XML = module;
	}
})(window);