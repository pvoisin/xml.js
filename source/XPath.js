var implementation = require("xpath");

var XPath = {
	/**
	 * @param {Node}   node       Node to evaluate the expression against.
	 * @param {String} expression X-Path expression to evaluate.
	 * @param {Object} [resolver] Simple URI resolver, like: `{"prefix": "http://...", ...}`.
	 *    Default namespace may be specified with the empty key: "".
	 * @return {Array} X-Path evaluation results.
	 */
	evaluate: function(node, expression, resolver) {
		var evaluate = !!resolver && (typeof resolver == "object") ? implementation.useNamespaces(resolver) : implementation.select;

		return evaluate(expression, node);
	}
};


module.exports = XPath;