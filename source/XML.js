var FileSystem = require("fs");
var DOM = require("xmldom");
var XPath = require("./XPath");


var XML = {
	declaration: "<?xml version=\"1.1\" encoding=\"UTF-8\"?>",

	/**
	 * @param {String} text XML text to parse.
	 * @return {Document}
	 */
	parse: function parse(text) {
		var parser = new DOM.DOMParser();
		return parser.parseFromString(text);
	},

	/**
	 * @param {String}  file	XML file to load.
	 * @return {Document}
	 */
	load: function load(file) {
		var document = String(FileSystem.readFileSync(file));
		document = XML.parse(document);

		return document;
	},

	/**
	 * @param {Node} node XML node to serialize.
	 * @return {String}
	 */
	serialize: function serialize(node) {
		var serializer = new DOM.XMLSerializer();
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
	}
};


module.exports = XML;