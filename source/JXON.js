var FileSystem = require("fs");
var y = require("ytility");
var XML = require("./XML");


var JXON = {
	/**
	 * @param {String} file XML file to load.
	 * @return {Document}
	 */
	load: function load(file) {
		var document = String(FileSystem.readFileSync(file));
		document = XML.parse(document);

		return this.convert(document, true);
	},

	/**
	 * @param {Node} node Node to convert into a JXON object.
	 * @return {Object}
	 */
	convert: function convert(node, compact) {
		var transformer = this.transformers[node.nodeType];

		if(!transformer) {
			throw new Error("Unsupported node type: " + node.nodeType);
		}

		var object = transformer(node);

		return compact || !y.isDefined(compact) ? this.compact(object) : object;
	},

	/**
	 * @param {Object} object JXON object to compact, which should not be compacted already.
	 * @return {Object}
	 */
	compact: function compact(object) {
		for(var type in object) break;
		(type[0] !== "#") && (type = "#ELEMENT");

		return this.compactors[type](object);
	}
};

Object.defineProperty(JXON, "transformers", {
	enumerable: false,
	value: (function() {
		var transformers = {
			"#DOCUMENT": function(node) {
				return transformers["#ELEMENT"](node.documentElement);
			},

			"#ELEMENT": function(node) {
				var result = {};

				var properties = result[node.nodeName] = {};

				y.forEach(node.attributes, function(attribute) {
					var transformer = transformers["#ATTRIBUTE"];
					y.forOwn(transformer(attribute), function(value, name) {
						if(name.indexOf("@xmlns") === 0) {
							var alias = name.split(":")[1];
							if(!("#NAMESPACE" in properties)) {
								properties["#NAMESPACE"] = {};
							}
							properties["#NAMESPACE"][alias || ""] = value;
						}
						else {
							properties[name] = value;
						}
					});
				});

				var children = properties["children"] = [];

				if(node.hasChildNodes()) {
					y.forEach(node.childNodes, function(child) {
						var transformer = transformers[child.nodeType];
						if(transformer) {
							var childResult = transformer(child);
							if(!y.isEmpty(childResult)) {
								children.push(childResult);
							}
						}
					});
				}

				return result;
			},

			"#ATTRIBUTE": function(node) {
				var result = {};

				result["@" + node.name] = node.value;

				return result;
			},

			"#TEXT": function(node) {
				var result = {};

				result["#TEXT"] = node.nodeValue;

				return result;
			},

			"#CDATA": function(node) {
				var result = {};

				result["#CDATA"] = node.nodeValue;

				return result;
			},

			"#COMMENT": function(node) {
				var result = {};

				result["#COMMENT"] = node.nodeValue;

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
	})()
});

Object.defineProperty(JXON, "compactors", {
	enumerable: false,
	value: (function() {
		var compactors = {
			"#ELEMENT": function(object) {
				for(var tag in object) break;
				var properties = object[tag];

				// Free the "children" key before attributes are re-written:
				var children = properties["children"];
				delete properties["children"];
				if(!y.isEmpty(children)) {
					properties["*"] = children;

					var index = 0;
					while(index < children.length) {
						var child = children[index];

						for(var type in child) break;
						(type[0] !== "#") && (type = "#ELEMENT");

						var result = compactors[type](child);
						if(!result) {
							children.splice(index, 1);
						}
						else {
							var previous = (index > 0) ? children[index - 1] : {};
							if(type === "#TEXT") {
								// Combine #TEXT objects:
								if(typeof(previous) === "string") {
									children[index - 1] += "\n" + child;
									children.splice(index, 1);
								}
								else {
									// Only #TEXT objects are to be replaced by `result`:
									children.splice(index, 1, result);
									index++
								}
							}
							else if((type === "#COMMENT") && (y.isObject(previous) && "#C" in previous)) {
								// Combine #COMMENT objects:
								previous["#C"] += "\n" + child["#C"];
								children.splice(index, 1);
							}
							else {
								index++;
							}
						}
					}

					// Take out the first child when it is alone:
					if(children.length === 1) {
						child = properties["*"] = children[0];

						// When it is a #TEXT child, extract its value:
						if(typeof(child) === "string") {
							properties["*"] = child;
						}
					}
				}

				// Rewrite attributes:
				var attributes = [];
				y.forOwn(properties, function(value, attribute) {
					if(attribute.charAt(0) === "@") {
						attributes.push(attribute);
						compactors["#ATTRIBUTE"](attribute, object);
					}
					else if(attribute === "#NAMESPACE") {
						delete properties["#NAMESPACE"];
						var keys = Object.keys(value);
						if(keys.length) {
							properties["#N"] = value;
							if(keys.length === 1) {
								properties["#N"] = value[keys[0]];
							}
						}
					}
				});

				// Compact even more when the object has no attribute and its unique child is a #TEXT object:
				if(y.isEmpty(attributes) && y.isString(properties["*"])) {
					object[tag] = properties["*"];
				}

				return object;
			},

			"#ATTRIBUTE": function compact(attribute, object) {
				var tag;
				for(tag in object) break;
				var properties = object[tag];

				properties[attribute.split("@")[1]] = properties[attribute];
				delete properties[attribute];

				return object;
			},

			"#TEXT": function(object) {
				return object["#TEXT"].trim() || null;
			},

			"#CDATA": function(object) {
				var text = object["#CDATA"].trim();

				if(text) {
					object["#D"] = text;
					delete object["#CDATA"];
				}

				return text ? object : null;
			},

			"#COMMENT": function(object) {
				var text = object["#COMMENT"].trim();

				if(text) {
					object["#C"] = text;
					delete object["#COMMENT"];
				}

				return text ? object : null;
			}
		};

		compactors[1] = compactors["#ELEMENT"];
		compactors[2] = compactors["#ATTRIBUTE"];
		compactors[3] = compactors["#TEXT"];
		compactors[4] = compactors["#CDATA"];
		compactors[8] = compactors["#COMMENT"];

		return compactors;
	})()
});

Object.defineProperty(JXON, "serializers", {
	enumerable: false,
	value: (function() {
		var serializers = {
			"#ELEMENT": function(object, document) {
				for(var tag in object) break;
				var properties = object[tag];
				var namespace = properties["#N"];

				var element = namespace ? document.createElementNS(namespace, tag) : document.createElement(tag);
//...

				return element;
			},

			"#ATTRIBUTE": function compact(attribute, object) {
				var tag;
				for(tag in object) break;
				var properties = object[tag];

				properties[attribute.split("@")[1]] = properties[attribute];
				delete properties[attribute];

				return object;
			},

			"#TEXT": function(object) {
				return object["#TEXT"].trim() || null;
			},

			"#CDATA": function(object) {
				var text = object["#CDATA"].trim();

				if(text) {
					object["#D"] = text;
					delete object["#CDATA"];
				}

				return text ? object : null;
			},

			"#COMMENT": function(object) {
				var text = object["#COMMENT"].trim();

				if(text) {
					object["#C"] = text;
					delete object["#COMMENT"];
				}

				return text ? object : null;
			}
		};

		serializers[1] = serializers["#ELEMENT"];
		serializers[2] = serializers["#ATTRIBUTE"];
		serializers[3] = serializers["#TEXT"];
		serializers[4] = serializers["#CDATA"];
		serializers[8] = serializers["#COMMENT"];

		return serializers;
	})()
});


module.exports = JXON;
