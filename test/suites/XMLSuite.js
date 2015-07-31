define(["XML", "JXON", "Flow"], function(XML, JXON, Flow) {
	var DOM, fixtures;

	before(function(proceed) {
		prepare(proceed);
	});

	describe("XML", function() {
		describe("#load", function() {
			it("should load properly", function(proceed) {
				XML.load("/test/fixtures/example.xml", function(error, document) {
					// Ideally we would check the document constructor but it depends on the platform...
					expect(document).to.be.ok();
					proceed();
				});
			});

			it("should load properly, into some JXON object (#1)", function(proceed) {
				JXON.load("/test/fixtures/example.xml", function(error, representation) {
					expect(representation).to.eql(fixtures["example-compact.json"]);
					proceed();
				});
			});

			it("should load properly, into some JXON object (#2)", function(proceed) {
				JXON.load("/test/fixtures/user.xml", function(error, representation) {
					expect(representation).to.eql(fixtures["user-compact.json"]);
					proceed();
				});
			});
		});

		describe("JXON", function() {
			describe("converters", function() {
				describe("#ELEMENT", function() {
					var converter = JXON.converters["#ELEMENT"];

					it("should transform elements properly", function(proceed) {
						var document = DOM.createDocument("", "document", null);
						var element = document.createElement("test");
						expect(converter(element)).to.eql({test:{}});

						document = fixtures["example.xml"];
						element = XML.query(document, "//color_swatch")[0];
						expect(converter(element)).to.eql({
							"color_swatch": {
								"@image": "red_cardigan.jpg",
								"children": [
									{"#TEXT": "Red"}
								]
							}
						});

						proceed();
					});
				});

				describe("#ATTRIBUTE", function() {
					var converter = JXON.converters["#ATTRIBUTE"];

					it("should transform #ATTRIBUTE nodes properly", function(proceed) {
						var document = fixtures["example.xml"];
						var attribute = XML.query(document, "//product[1]/@description")[0];
						expect(converter(attribute)).to.eql({"@description": "Cardigan Sweater"});

						attribute = XML.query(document, "//product/@store:addition")[0];
						expect(converter(attribute, {"store": "http://store"})).to.eql({"@store:addition": "coupon"});

						proceed();
					});
				});

				describe("#TEXT", function() {
					var converter = JXON.converters["#TEXT"];

					it("should transform #TEXT nodes properly", function() {
						var document = fixtures["example.xml"];
						var node = XML.query(document, "//item_number[1]/text()")[0];
						expect(converter(node)).to.eql({"#TEXT": "QWZ5671"});
					});
				});

				describe("#CDATA", function() {
					var converter = JXON.converters["#CDATA"];

					it("should transform #CDATA nodes properly", function() {
						var document = fixtures["example.xml"];
						var node = XML.query(document, "//script/text()")[0];
						var proof = {"#CDATA": "function(a, b) {\n    if (a < b && a < 0) { return 1; }\n    else { return 0; }\n}"};
						expect(converter(node)).to.eql(proof);
					});
				});

				describe("#COMMENT", function() {
					var converter = JXON.converters["#COMMENT"];

					it("should transform #COMMENT nodes properly", function() {
						var document = fixtures["example.xml"];
						var node = XML.query(document, "//comment()")[0];
						var proof = {"#COMMENT": " Source: https://developer.mozilla.org/en-US/docs/JXON#example.xml "};
						expect(converter(node)).to.eql(proof);
					});
				});
			});

			describe("#convert", function() {
				it("should convert XML documents properly", function(proceed) {
					XML.load("/test/fixtures/example.xml", function(error, document) {
						var root = XML.query(document, "/*")[0];
						var representation = JXON.convert(root, false);
						expect(representation).to.eql(fixtures["example.json"]);
						proceed();
					});
				});

				it("should convert XML documents properly, in compact mode", function(proceed) {
					XML.load("/test/fixtures/example.xml", function(error, document) {
						expect(document).to.be.ok();
						var root = XML.query(document, "/*")[0];
						expect(JXON.convert(root)).to.eql(fixtures["example-compact.json"]);
						proceed();
					});
				});
			});

			describe("compactors", function() {
				describe("#ELEMENT", function() {
					var compactor = JXON.compactors["#ELEMENT"];

					it("should compact objects properly", function(proceed) {
						var document = fixtures["user.xml"];
						var representation = JXON.convert(document, false);
						expect(compactor(representation)).to.eql(fixtures["user-compact.json"]);

						proceed();
					});
				});

				describe("#ATTRIBUTE", function() {
					var compactor = JXON.compactors["#ATTRIBUTE"];

					it("should compact objects properly", function(proceed) {
						var document = fixtures["user.xml"];
						var node = XML.query(document, "//here:contact[1]", {"here": "http://being.here/"})[0];
						var representation = JXON.convert(node, false);
						var proof = {
							"contact": {
								"#NAMESPACE": {
									"": "http://being.here/"
								},
								"@firstName": "John",
								"@lastName": "Bird"
							}
						};
						expect(representation).to.eql(proof);
						proof.contact.firstName = proof.contact["@firstName"];
						delete proof.contact["@firstName"];
						expect(compactor("@firstName", representation)).to.eql(proof);

						proceed();
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
				it("should compact JXON objects properly", function(proceed) {
					var document = fixtures["user.xml"];
					var representation = JXON.convert(document);
					expect(JXON.compact(representation)).to.eql(fixtures["user-compact.json"]);
					proceed();
				});
			});

			describe("#isCompact", function() {
				it("should detect compact form properly", function(proceed) {
					expect(JXON.isCompact({tag: {"*": []}})).to.be(true);
					expect(JXON.isCompact({tag: {children: []}})).to.be(false);
					expect(JXON.isCompact({tag: {"#N": "not supposed to exist", "@a": 1, children: []}})).to.be(false);
					expect(JXON.isCompact({tag: {children: {something: "different"}}})).to.be(true);

					JXON.load("/test/fixtures/user.xml", function(error, document) {
						var representation = JXON.compact(document);
						expect(JXON.isCompact(representation)).to.be(true);
						proceed();
					});
				});
			});

			describe("reverters", function() {
				var document = fixtures["user.xml"];
				var representation = JXON.convert(document, false);

				describe("#ELEMENT", function() {
					it("should revert #ELEMENT nodes properly", function() {
						var result = JXON.reverters["#ELEMENT"](representation, document);
console.log(result);
						expect(XML.serialize(result)).to.eql(fixtures["user.xml"].split("<?xml version=\"1.0\"?>\n")[1]);
					});
				});
/*
				describe("#ATTRIBUTE", function() {
					it("should revert #ATTRIBUTE nodes properly", function() {
						var node = XML.query(document, "//here:contact[1]", {"here": "http://being.here/"})[0];
						var representation = JXON.convert(node, false);
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
						expect(representation).to.eql(proof);
						proof.contact.firstName = proof.contact["@firstName"];
						delete proof.contact["@firstName"];
						expect(JXON.compactors["#ATTRIBUTE"]("@firstName", representation)).to.eql(proof);
					});
				});
//*/
				describe("#TEXT", function() {
					it("should revert #TEXT nodes properly", function() {
						expect(JXON.compactors["#TEXT"]({"#TEXT": "\r\n??? \t"})).to.eql("???");
						expect(JXON.compactors["#TEXT"]({"#TEXT": "\n\t \r"})).to.be(null);
					});
				});

				describe("#CDATA", function() {
					it("should revert #CDATA nodes properly", function() {
						var text = "\r\n??? \t";
						var result = JXON.reverters["#CDATA"]({"#CDATA": text}, document);
						expect(result).to.eql(document.createCDATASection(text));
						result = JXON.reverters["#CDATA"]({"#D": text}, document);
						expect(result).to.eql(document.createCDATASection(text));
					});
				});

				describe("#COMMENT", function() {
					it("should revert #COMMENT nodes properly", function() {
						var text = "\r\n??? \t";
						var result = JXON.reverters["#COMMENT"]({"#COMMENT": text}, document);
						expect(result).to.eql(document.createComment(text));
						result = JXON.reverters["#COMMENT"]({"#C": text}, document);
						expect(result).to.eql(document.createComment(text));
					});
				});
			});
		});
	});

	function prepare(callback) {
		var files = [
			"example.json",
			"example.xml",
			"example-compact.json",
			"user.json",
			"user.xml",
			"user-compact.json"
		];

		fixtures = {};

		Flow.parallel(files.map(function(file) {
			return function(next) {
				getFixture(file, next);
			};
		}), function(error, next) {
			callback();
		});

		DOM = XML.parse("<?xml version=\"1.0\"?><document/>").implementation;
	}

	function getFixture(file, callback) {
		// `file` should be a string like "source:<file>" or "<file>".
		if(!file || typeof file !== "string" || !/^(source:)?/.test(file)) {
			throw new Error("Invalid fixture:" + file);
		}

		var parts = file.split("source:");
		var askedForSource = !!parts[1];
		file = parts[1] || parts[0];

		var source = fixtures["source:" + file];
		var fixture = fixtures[file];

		if(source) {
			whenHavingSource();
		}
		else {
			var locator = "/test/fixtures/" + file;

			load(locator, function(error, contents) {
				if(error) {
					throw error;
				}

				source = contents;
				fixtures["source:" + file] = source;

				if(!error) {
					whenHavingSource();
				}
				else {
					callback && callback(error);
				}
			});
		}

		function whenHavingSource() {
			if(askedForSource) {
				callback(null, source);
			}
			else {
				if(fixture) {
					whenHavingFixture();
				}
				else {
					try {
						if(/\.json$/.test(file)) {
							fixture = JSON.parse(source);
						}
						else if(/\.xml/.test(file)) {
							fixture = XML.parse(source);
						}

						fixtures[file] = fixture;

						whenHavingFixture();
					}
					catch(error) {
						callback && callback(error);
					}
				}
			}
		}

		function whenHavingFixture() {
			callback && callback(null, fixture);
		}

		return askedForSource ? source : fixture;
	}

	function load(locator, callback) {
		var request = new XMLHttpRequest();

		request.open("GET", String(locator), true);

		request.onreadystatechange = function() {
			if(request.readyState == 4) {
				if(request.status < 100 || request.status >= 400) {
					callback && callback(new Error("Failed (" + request.status + ")!"));
				}
				else {
					var contents = request.responseText;

					callback && callback(null, contents);
				}
			}
		};

		request.send();

		return request;
	}
});