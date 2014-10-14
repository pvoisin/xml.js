var FileSystem = require("fs");
var Utility = require("./Utility");
var DOM = require("xmldom");

var XML = {
	declaration: "<?xml version=\"1.0\" encoding=\"UTF-8\"?>",

	/**
	 * @param {Node} node XML node to serialize.
	 * @return {String}
	 */
	serialize: function serialize(node) {
		var serializer = new DOM.XMLSerializer();
		return serializer.serializeToString(node);
	},

	/**
	 * @param {String} text XML text to parse.
	 * @return {Document}
	 */
	parse: function parse(text) {
		var parser = new DOM.DOMParser();
		return parser.parseFromString(text);
	},

	/**
	 * @param {String} file XML file to load.
	 * @return {Document}
	 */
	load: function load(file) {
		return XML.parse(String(FileSystem.readFileSync(file)));
	},

	/**
	 * @param {Node}   node       Node to evaluate the expression on.
	 * @param {String} expression X-Path expression to evaluate.
	 * @param {Object} resolver   Simple URI resolver like {"prefix": "http://...", ...}.
	 *   Default namespace may be specified with the empty key: "".
	 * @return {Array} X-Path evaluation results.
	 */
	query: function query(node, expression, resolver) {
		var XPath = require("xpath");

		var evaluate = !!resolver && (typeof resolver == "object") ? XPath.useNamespaces(resolver) : XPath.select;

		return evaluate(expression, node);
	},

	convert: function convert(node, compact) {
		return XML.JXON.convert(node, compact);
	}
};


XML.JXON = {
	transformers: (function() {
		var transformers = {
			"#DOCUMENT": function(node, compact) {
				return transformers["#ELEMENT"](node.firstChild, compact);
			},

			"#ELEMENT": function(node, compact) {
				var result = {};

				var properties = result[node.nodeName] = {};
				var children = properties[!compact ? "children" : "*"] = [];

				if(node.hasChildNodes()) {
					Utility.forEach(node.attributes, function(attribute) {
						var transformer = transformers["#ATTRIBUTE"];
						Utility.forOwn(transformer(attribute, compact), function(value, name) {
							properties[name] = value;
						});
					});

					Utility.forEach(node.childNodes, function(child) {
						var transformer = transformers[child.nodeType];
						if(transformer) {
							var childResult = transformer(child, compact);
							if(!Utility.isEmpty(childResult)) {
								children.push(childResult);
							}
						}
					});
				}

				return result;
			},

			"#ATTRIBUTE": function(node, compact) {
				var result = {};

				result[(!compact ? "@" : "") + node.name] = node.value;

				return result;
			},

			"#TEXT": function(node, compact) {
				var result = {};

				if(!compact) {
					result["#TEXT"] = node.nodeValue;
				}
				else {
					var text = node.nodeValue.trim();
					if(text) {
						result["#T"] = text;
					}
				}

				return result;
			},

			"#CDATA": function(node, compact) {
				var result = {};

				if(!compact) {
					result["#CDATA"] = node.nodeValue;
				}
				else {
					var text = node.nodeValue.trim();
					if(text) {
						result["#D"] = text;
					}
				}

				return result;
			},

			"#COMMENT": function(node, compact) {
				var result = {};

				if(!compact) {
					result["#COMMENT"] = node.nodeValue;
				}
				else {
					var text = node.nodeValue.trim();
					if(text) {
						result["#C"] = text;
					}
				}

				return result;
			}
		};

		transformers[1] = transformers["#ELEMENT"];
		transformers[2] = transformers["#ATTRIBUTE"];
		transformers[3] = transformers["#TEXT"];
		transformers[4] = transformers["#CDATA"];
		transformers[8] = transformers["#COMMENT"];
		transformers[9] = transformers["#DOCUMENT"];

		return transformers;
	})(),

	convert: function convert(node, compact) {
		var transformer = this.transformers[node.nodeType];

		if(!transformer) {
			throw new Error("Not supported!");
		}

		return transformer(node, compact);
	}
};


module.exports = XML;