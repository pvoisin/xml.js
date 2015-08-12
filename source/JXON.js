(function(global) {
	function factory(y, XML) {
		var DOM = XML.parse("<document/>").implementation;

		var JXON = {
			/**
			 * @param {String}   locator     Locator of the XML file to load.
			 * @param {Function} callback    Function to be called when the file is loaded.
			 * @return {Document}
			 */
			load: function load(locator, callback) {
				var self = this;

				var loader = XML.load(locator, function(error, document) {
					try {
						var representation = self.convert(document, true);
					}
					catch(error) {
						var caught = true;
						callback && callback(error);
					}

					!caught && callback && callback(null, representation);
				});

				return loader;
			},

			/**
			 * @param {Node}  node  Node to convert into a JXON object.
			 * @return {Object}
			 */
			convert: function convert(node, compact) {
				var converter = this.converters[node.nodeType];

				if(!converter) {
					throw new Error("Unsupported node type: " + node.nodeType);
				}

				var object = converter(node);

				return compact || !y.isDefined(compact) ? this.compact(object) : object;
			},

			/**
			 * @param {Object} object  JXON object to compact, which should not be compacted already.
			 * @return {Object}
			 */
			compact: function compact(object) {
				for(var type in object) break;
				(type[0] !== "#") && (type = "#ELEMENT");

				return this.compactors[type](object);
			},

			isCompact: function isCompact(object) {
				for(var tag in object) break;
				var properties = object[tag];

				var compact = "*" in properties;
				var determined = compact;

				if(!determined) {
					if(y.isArray(properties["children"])) {
						determined = true;
					}

					var keys = Object.keys(properties);
					var index = 0;
					while(!determined && index < keys.length) {
						if(keys[index][0] === "@") {
							determined = true;
						}
						index++;
					}

					if(!determined) {
						compact = true;
						determined = true;
					}
				}

				if(!determined) {
					throw new Error("Uh, oh!");
				}

				return compact;
			}
		};

		Object.defineProperty(JXON, "converters", {
			enumerable: false,
			value: (function() {
				var converters = {
					"#DOCUMENT": function convert(node) {
						return converters["#ELEMENT"](node.documentElement);
					},

					"#ELEMENT": function convert(node, namespaces) {
						var result = {};

						var name = "";
						var prefix = getPrefix(node, namespaces);
						prefix && (name += prefix + ":");
						name += node.localName;
						var properties = result[name] = {};

						y.forEach(node.attributes, function(attribute) {
							var converter = converters["#ATTRIBUTE"];
							y.forOwn(converter(attribute), function(value, name) {
								if(name.indexOf("@xmlns") === 0) {
									var alias = name.split(":")[1];
									if(!("#NAMESPACE" in properties)) {
										properties["#NAMESPACE"] = {};
									}

									properties["#NAMESPACE"][alias || ""] = value;
									namespaces && (namespaces[alias || ""] = value);
								}
								else {
									properties[name] = value;
								}
							});
						});

						var children = [];

						if(node.hasChildNodes()) {
							y.forEach(node.childNodes, function(child) {
								var converter = converters[child.nodeType];
								if(converter) {
									var childResult = converter(child, namespaces);
									if(!y.isEmpty(childResult)) {
										children.push(childResult);
									}
								}
							});

							properties["children"] = children;
						}

						return result;
					},

					"#ATTRIBUTE": function convert(node, namespaces) {
						var result = {};

						var name = "@";
						var prefix = getPrefix(node, namespaces);
						prefix && (name += prefix + ":");
						name += node.localName;
						result[name] = node.value;

						return result;
					},

					"#TEXT": function convert(node) {
						var result = {};

						result["#TEXT"] = node.nodeValue;

						return result;
					},

					"#CDATA": function convert(node) {
						var result = {};

						result["#CDATA"] = node.nodeValue;

						return result;
					},

					"#COMMENT": function convert(node) {
						var result = {};

						result["#COMMENT"] = node.nodeValue;

						return result;
					}
				};

				converters[1] = converters["#ELEMENT"];
				converters[2] = converters["#ATTRIBUTE"];
				converters[3] = converters["#TEXT"];
				converters[4] = converters["#CDATA"];
				converters[8] = converters["#COMMENT"];
				converters[9] = converters["#DOCUMENT"];

				return converters;
			})()
		});

		Object.defineProperty(JXON, "compactors", {
			enumerable: false,
			value: (function() {
				var compactors = {
					"#ELEMENT": function compact(object) {
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
									if(keys.length === 1 && keys[0] === "") {
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

					"#TEXT": function compact(object) {
						return object["#TEXT"].trim() || null;
					},

					"#CDATA": function compact(object) {
						var text = object["#CDATA"].trim();

						if(text) {
							object["#D"] = text;
							delete object["#CDATA"];
						}

						return text ? object : null;
					},

					"#COMMENT": function compact(object) {
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

		Object.defineProperty(JXON, "reverters", {
			enumerable: false,
			value: (function() {
				var reverters = {
					"#ELEMENT": function revert(object, document) {
						var compact = JXON.isCompact(object);

						for(var tag in object) break;
						var properties = object[tag];

						var parts = tag.split(":");
						var name = parts[1] || parts[0];
						if(parts[1]) {
							var prefix = parts[0];
							tag = prefix + ":" + name;
						}

						var namespaces = compact ? properties["#N"] : properties["#NAMESPACE"];
						if(namespaces) {
							// Case when no alias is defined at that node's level: it simply is the node's namespace URI.
							if(typeof namespaces === "string") {
								var namespace = namespaces;
							}
							else {
								namespace = namespaces[""];
							}
						}

						document = document || DOM.createDocument("", "document", null);

						if(namespace) {
							var element = document.createElementNS(namespace, tag);
							element.setAttribute("xmlns", namespace);
						}
						else {
							element = document.createElement(tag);
						}

						var children = (compact ? properties["*"] : properties["children"]) || [];

						var index = 0;
						while(index < children.length) {
							var child = children[index];

							for(var type in child) break;
							(type[0] !== "#") && (type = "#ELEMENT");

							var result = reverters[type](child, document);
							element.appendChild(result);
							index++;
						}

						for(var key in properties) {
							if(properties[key] !== children && key[0] !== "#") {
								var attribute = key;
								if(!compact && attribute[0] === "@") {
									attribute = attribute.substring(1);
								}
// TODO: create #ATTRIBUTE nodes then append with `Element#setAttributeNode`
								element.setAttribute(attribute, properties[key]);
							}
						}

						// Register other namespaces:
						for(var alias in namespaces) {
							alias && element.setAttribute("xmlns:" + alias, namespaces[alias]);
						}

						return element;
					},
/*
					"#ATTRIBUTE": function make(attribute, object, document) {
						var tag;
						for(tag in object) break;
						var properties = object[tag];

						properties[attribute.split("@")[1]] = properties[attribute];
						delete properties[attribute];

						return object;
					},
//*/
					"#TEXT": function revert(object, document) {
						return document.createTextNode(object["#TEXT"] || object);
					},

					"#CDATA": function revert(object, document) {
						return document.createCDATASection(object["#D"] || object["#CDATA"]);
					},

					"#COMMENT": function revert(object, document) {
						return document.createComment(object["#C"] || object["#COMMENT"]);
					}
				};

				reverters[1] = reverters["#ELEMENT"];
				reverters[2] = reverters["#ATTRIBUTE"];
				reverters[3] = reverters["#TEXT"];
				reverters[4] = reverters["#CDATA"];
				reverters[8] = reverters["#COMMENT"];

				return reverters;
			})()
		});

		function getPrefix(node, namespaces) {
			var prefix = node.prefix || undefined;

			if(!prefix) {
				if(node.nodeName !== node.localName) {
					prefix = node.nodeName.split(":")[0];
				}
				else if(node.namespaceURI && namespaces) {
					for(prefix in namespaces) {
						if(node.namespaceURI === namespaces[prefix]) {
							var found = true;
							break;
						}
					}

					!found && (prefix = undefined);
				}
			}

			return prefix;
		}

		return JXON;
	}

	var AMD = (typeof define === "function") && define.amd;

	if(!AMD) {
		var resolver = {
			"ytility": global["y"]
		};

		global["define"] = function(modules, callback) {
			return callback.apply(this, modules.map(function(module) {
				return resolver[module] || global[module];
			}));
		}
	}

	var module = define(["ytility", "XML"], factory);

	if(!AMD) {
		global.JXON = module;
	}
})(window);