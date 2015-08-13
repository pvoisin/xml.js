(function(global) {
	function factory() {
		var XPath = {
			/**
			 * @param {Node}   node       Node to evaluate the expression against.
			 * @param {String} expression X-Path expression to evaluate.
			 * @param {Object} [namespaces] Simple URI resolver, like: `{"prefix": "http://...", ...}`.
			 *    Default namespace may be specified with the empty key: "".
			 * @return {Array} X-Path evaluation results.
			 */
			evaluate: function(node, expression, namespaces) {
				var index, resolver, resultSet, result, results = [];

				var document = node.ownerDocument || node;

				// Internet Explorer case:
				if(!document.evaluate) {
					// IMPORTANT: `document` should be some instance of "Microsoft.DOMXML" for it to have the correct API.
					// Before calling `evaluate` you may need to transform it with the `fix` function, like:
					//  XPath.evaluate(XML.fix(document), "...", {...});
					document.setProperty("SelectionLanguage", "XPath");

					if(namespaces) {
						document.setProperty("SelectionNamespaces", Object.keys(namespaces).map(function(prefix) {
							return "xmlns" + ((prefix != "?") ? ":" + prefix : "") + "='" + namespaces[prefix] + "'";
						}).join(" "));
					}

					// API: http://msdn.microsoft.com/en-us/library/windows/desktop/ms767664(v=vs.85).aspx
					resultSet = node.selectNodes(expression);

					for(index = 0; index < resultSet.length; index++) {
						// API: http://msdn.microsoft.com/en-us/library/windows/desktop/ms761386(v=vs.85).aspx
						result = resultSet.item(index);
						// X-Path expression are supposed to target nodes only so here we're only getting nodes and we cannot return anything more precise...
						// Note: that also means that we cannot evaluate expressions like "count(*)" because it would return a number.
						results.push(result);
					}
				}
				else {
					resolver = null;

					if(namespaces) {
						resolver = function(prefix) {
							return namespaces[prefix || "?"];
						};
					}
					else if(document.createNSResolver) {
						resolver = document.createNSResolver(node);
					}

					resultSet = document.evaluate(expression, node, resolver, XPathResult.ANY_TYPE, null);

					switch(resultSet.resultType) {
						case XPathResult.NUMBER_TYPE:
							results = resultSet.numberValue;
							break;

						case XPathResult.STRING_TYPE:
							results = resultSet.stringValue;
							break;

						case XPathResult.BOOLEAN_TYPE:
							results = resultSet.booleanValue;
							break;

						case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
						case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
							node = null;
							while(node = resultSet.iterateNext()) {
								results.push(node);
							}
							break;

						case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
						case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
							for(index = 0; index < resultSet.snapshotLength; ++index) {
								results.push(resultSet.snapshotItem(index));
							}
							break;

						case XPathResult.ANY_UNORDERED_NODE_TYPE:
						case XPathResult.FIRST_ORDERED_NODE_TYPE:
							results.push(resultSet.singleNodeValue);
							break;
					}
				}

				return results;
			}
		};

		return XPath;
	}

	var AMD = (typeof define === "function") && define.amd;

	if(!AMD) {
		define = function define(modules, callback) {
			return callback.apply(this, modules.map(function(module) {
				return global[module];
			}));
		}
	}

	var module = define([], factory);

	if(!AMD) {
		global.XPath = module;
	}
})(this);