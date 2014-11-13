var Path = require("path");
var expect = require("expect.js");
var Utility = require("ytility");
var XML = require("../../source/XML");
var JXON = XML.JXON;

describe("XML", function() {
	var fixture = Path.resolve(__dirname, "../fixtures/example.xml");
	var document = XML.load(fixture);
	var root = XML.query(document, "/*")[0];

	describe("#load", function() {
		it("should load properly", function() {
			expect(document).to.be.ok();
		});

		it("should load properly, into some JXON object", function() {
			expect(XML.load(fixture, true)).to.eql(require("../fixtures/example-compact.json"));
			expect(XML.load(Path.resolve(__dirname, "../fixtures/user.xml"), true)).to.eql(require("../fixtures/user-compact.json"));
		});
	});

	describe("JXON", function() {
		describe("transformers", function() {
			describe("#ELEMENT", function() {
				var transformer = JXON.transformers["#ELEMENT"];
				var node = XML.query(document, "//color_swatch")[0];

				it("should transform elements properly", function() {
					expect(transformer(node)).to.eql({
						"color_swatch": {
							"@image": "red_cardigan.jpg",
							"children": [
								{"#TEXT": "Red"}
							]
						}
					});
				});
			});

			describe("#ATTRIBUTE", function() {
				var transformer = JXON.transformers["#ATTRIBUTE"];
				var node = XML.query(document, "//product[1]/@description")[0];

				it("should transform text nodes properly", function() {
					expect(transformer(node)).to.eql({"@description": "Cardigan Sweater"});
				});
			});

			describe("#TEXT", function() {
				var transformer = JXON.transformers["#TEXT"];
				var node = XML.query(document, "//item_number[1]/text()")[0];
				var text = "QWZ5671";

				it("should transform text nodes properly", function() {
					expect(transformer(node)).to.eql({"#TEXT": text});
				});
			});

			describe("#CDATA", function() {
				var transformer = JXON.transformers["#CDATA"];
				var node = XML.query(document, "//script/text()")[0];
				var text = "function matchwo(a,b) {\n    if (a < b && a < 0) { return 1; }\n    else { return 0; }\n}";

				it("should transform CDATA sections properly", function() {
					expect(transformer(node)).to.eql({"#CDATA": text});
				});
			});
		});

		describe("#convert", function() {
			it("should convert XML documents properly", function() {
				expect(JXON.convert(root, false)).to.eql(require("../fixtures/example.json"));
			});

			it("should convert XML documents properly, in compact mode", function() {
				expect(JXON.convert(root)).to.eql(require("../fixtures/example-compact.json"));
			});
		});

		describe("compactors", function() {
			var fixture = Path.resolve(__dirname, "../fixtures/user.xml");
			var document = XML.load(fixture);

			describe("#ELEMENT", function() {
				it("should compact objects properly", function() {
					var object = JXON.convert(document, false);
					expect(JXON.compactors["#ELEMENT"](object)).to.eql(require("../fixtures/user-compact.json"));
				});
			});

			describe("#ATTRIBUTE", function() {
				it("should compact objects properly", function() {
					var node = XML.query(document, "//here:contact[1]", {"here": "http://being.here/"})[0];
					var object = JXON.convert(node, false);
					var proof = {
						"contact": {
							"#NAMESPACE": {
								"": "http://being.here/",
								"B": "http://B.b/"
							},
							"@firstName": "John",
							"@lastName": "Bird",
							children: []
						}
					};
					expect(object).to.eql(proof);
					proof.contact.firstName = proof.contact["@firstName"];
					delete proof.contact["@firstName"];
					expect(JXON.compactors["#ATTRIBUTE"]("@firstName", object)).to.eql(proof);
				});
			});

			describe("#TEXT", function() {
				it("should compact objects properly", function() {
					expect(JXON.compactors["#TEXT"]({"#TEXT": "\r\n??? \t"})).to.eql("???");
					expect(JXON.compactors["#TEXT"]({"#TEXT": "\n\t \r"})).to.be(null);
				});
			});

			describe("#CDATA", function() {
				it("should compact objects properly", function() {
					expect(JXON.compactors["#CDATA"]({"#CDATA": "\r\n??? \t"})).to.eql({"#D": "???"});
					expect(JXON.compactors["#CDATA"]({"#CDATA": "\n\t \r"})).to.be(null);
				});
			});

			describe("#COMMENT", function() {
				it("should compact objects properly", function() {
					expect(JXON.compactors["#COMMENT"]({"#COMMENT": "\r\n??? \t"})).to.eql({"#C": "???"});
					expect(JXON.compactors["#COMMENT"]({"#COMMENT": "\n\t \r"})).to.be(null);
				});
			});
		});

		describe("#compact", function() {
			it("should compact JXON objects properly", function() {
				var fixture = Path.resolve(__dirname, "../fixtures/user.xml");
				var proof = require("../fixtures/user-compact.json");
				expect(JXON.compact(XML.load(fixture, true))).to.eql(proof);
			});
		});
	});
});