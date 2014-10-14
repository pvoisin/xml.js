var Path = require("path");
var expect = require("expect.js");
var Utility = require("../../source/Utility");
var XML = require("../../source/XML");

describe("XML", function() {
	var fixture = Path.resolve(__dirname, "../fixtures/example.xml");
	var document = XML.load(fixture);
	var root = XML.query(document, "/*")[0];

	describe("#load", function() {
		it("should load properly", function() {
			expect(document).to.be.ok();
		});

		it("should load properly, into some JXON object", function() {
			expect(XML.load(fixture, {convert: true})).to.eql(require("../fixtures/example.json"));
			expect(XML.load(fixture, {convert: true, compact: true})).to.eql(require("../fixtures/example-compact.json"));
			expect(XML.load(fixture, {compact: true})).to.eql(require("../fixtures/example-compact.json"));
		});
	});

	describe("#convert", function() {
		it("should convert XML nodes properly", function() {
			expect(XML.convert(document)).to.eql(require("../fixtures/example.json"));
		});
	});

	describe("JXON", function() {
		describe("transformers", function() {
			describe("#ELEMENT", function() {
				var transformer = XML.JXON.transformers["#ELEMENT"];
				var node = XML.query(document, "//color_swatch")[0];

				it("should transform elements properly", function() {
					expect(transformer(node)).to.eql({"color_swatch": {
						"@image": "red_cardigan.jpg",
						"children": [
							{"#TEXT": "Red"}
						]}
					});
				});

				it("should transform elements properly, in compact mode", function() {
					expect(transformer(node, true)).to.eql({"color_swatch": {
						"image": "red_cardigan.jpg",
						"*": [
							{"#T": "Red"}
						]}
					});
				});

			});

			describe("#ATTRIBUTE", function() {
				var transformer = XML.JXON.transformers["#ATTRIBUTE"];
				var node = XML.query(document, "//product[1]/@description")[0];

				it("should transform text nodes properly", function() {
					expect(transformer(node)).to.eql({"@description": "Cardigan Sweater"});
				});

				it("should transform text nodes properly, in compact mode", function() {
					expect(transformer(node, true)).to.eql({"description": "Cardigan Sweater"});
				});
			});

			describe("#TEXT", function() {
				var transformer = XML.JXON.transformers["#TEXT"];
				var node = XML.query(document, "//item_number[1]/text()")[0];
				var text = "QWZ5671";

				it("should transform text nodes properly", function() {
					expect(transformer(node)).to.eql({"#TEXT": text});
				});

				it("should transform text nodes properly, in compact mode", function() {
					expect(transformer(node, true)).to.eql({"#T": text});
				});
			});

			describe("#CDATA", function() {
				var transformer = XML.JXON.transformers["#CDATA"];
				var node = XML.query(document, "//script/text()")[0];
				var text = "function matchwo(a,b) {\n    if (a < b && a < 0) { return 1; }\n    else { return 0; }\n}";

				it("should transform CDATA sections properly", function() {
					expect(transformer(node)).to.eql({"#CDATA": text});
				});

				it("should transform CDATA sections properly, in compact mode", function() {
					expect(transformer(node, true)).to.eql({"#D": text});
				});
			});
		});

		describe("#convert", function() {
			it("should convert XML documents properly", function() {
				expect(XML.JXON.convert(root)).to.eql(require("../fixtures/example.json"));
			});

			it("should convert XML documents properly, in compact mode", function() {
				expect(XML.JXON.convert(root, true)).to.eql(require("../fixtures/example-compact.json"));
			});
		});
	});
});