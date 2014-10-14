# XML.js

## Example

Let's say you have the following XML file:

```xml
<catalog>
    <!-- Source: https://developer.mozilla.org/en-US/docs/JXON#example.xml -->
    <product description="Cardigan Sweater">
        <catalog_item gender="Men's">
            <item_number>QWZ5671</item_number>
            <price>39.95</price>
            <size description="Medium">
                <color_swatch image="red_cardigan.jpg">Red</color_swatch>
                <color_swatch image="burgundy_cardigan.jpg">Burgundy</color_swatch>
            </size>
            <size description="Large">
                <color_swatch image="red_cardigan.jpg">Red</color_swatch>
                <color_swatch image="burgundy_cardigan.jpg">Burgundy</color_swatch>
            </size>
        </catalog_item>
        <catalog_item gender="Women's">
            <item_number>RRX9856</item_number>
            <discount_until>Dec 25, 1995</discount_until>
            <price>42.50</price>
            <size description="Medium">
                <color_swatch image="black_cardigan.jpg">Black</color_swatch>
            </size>
        </catalog_item>
    </product>
    <script type="text/javascript"><![CDATA[function matchwo(a,b) {
    if (a < b && a < 0) { return 1; }
    else { return 0; }
}]]></script>
</catalog>
```

Instructions below would turn it into some [JXON](https://developer.mozilla.org/en-US/docs/JXON) object: 

```javascript
var XML = require("xml.js");

var document = XML.load(Path.resolve(__dirname, "../fixtures/example.xml"));
var root = XML.query(document, "/*")[0];
var object = XML.convert(root);
```

With `object` being the following:

```javascript
{
	"catalog": {
		"children": [
			{
				"#TEXT": "\n    "
			},
			{
				"#COMMENT": " Source: https://developer.mozilla.org/en-US/docs/JXON#example.xml "
			},
			{
				"#TEXT": "\n    "
			},
			{
				"product": {
					"@description": "Cardigan Sweater",
					"children": [
						{
							"#TEXT": "\n        "
						},
						{
							"catalog_item": {
								"@gender": "Men's",
								"children": [
									{
										"#TEXT": "\n            "
									},
									{
										"item_number": {
											"children": [
												{
													"#TEXT": "QWZ5671"
												}
											]
										}
									},
									{
										"#TEXT": "\n            "
									},
									{
										"price": {
											"children": [
												{
													"#TEXT": "39.95"
												}
											]
										}
									},
									{
										"#TEXT": "\n            "
									},
									{
										"size": {
											"@description": "Medium",
											"children": [
												{
													"#TEXT": "\n                "
												},
												{
													"color_swatch": {
														"@image": "red_cardigan.jpg",
														"children": [
															{
																"#TEXT": "Red"
															}
														]
													}
												},
												{
													"#TEXT": "\n                "
												},
												{
													"color_swatch": {
														"@image": "burgundy_cardigan.jpg",
														"children": [
															{
																"#TEXT": "Burgundy"
															}
														]
													}
												},
												{
													"#TEXT": "\n            "
												}
											]
										}
									},
									{
										"#TEXT": "\n            "
									},
									{
										"size": {
											"@description": "Large",
											"children": [
												{
													"#TEXT": "\n                "
												},
												{
													"color_swatch": {
														"@image": "red_cardigan.jpg",
														"children": [
															{
																"#TEXT": "Red"
															}
														]
													}
												},
												{
													"#TEXT": "\n                "
												},
												{
													"color_swatch": {
														"@image": "burgundy_cardigan.jpg",
														"children": [
															{
																"#TEXT": "Burgundy"
															}
														]
													}
												},
												{
													"#TEXT": "\n            "
												}
											]
										}
									},
									{
										"#TEXT": "\n        "
									}
								]
							}
						},
						{
							"#TEXT": "\n        "
						},
						{
							"catalog_item": {
								"@gender": "Women's",
								"children": [
									{
										"#TEXT": "\n            "
									},
									{
										"item_number": {
											"children": [
												{
													"#TEXT": "RRX9856"
												}
											]
										}
									},
									{
										"#TEXT": "\n            "
									},
									{
										"discount_until": {
											"children": [
												{
													"#TEXT": "Dec 25, 1995"
												}
											]
										}
									},
									{
										"#TEXT": "\n            "
									},
									{
										"price": {
											"children": [
												{
													"#TEXT": "42.50"
												}
											]
										}
									},
									{
										"#TEXT": "\n            "
									},
									{
										"size": {
											"@description": "Medium",
											"children": [
												{
													"#TEXT": "\n                "
												},
												{
													"color_swatch": {
														"@image": "black_cardigan.jpg",
														"children": [
															{
																"#TEXT": "Black"
															}
														]
													}
												},
												{
													"#TEXT": "\n            "
												}
											]
										}
									},
									{
										"#TEXT": "\n        "
									}
								]
							}
						},
						{
							"#TEXT": "\n    "
						}
					]
				}
			},
			{
				"#TEXT": "\n    "
			},
			{
				"script": {
					"@type": "text/javascript",
					"children": [
						{
							"#CDATA": "function matchwo(a,b) {\n    if (a < b && a < 0) { return 1; }\n    else { return 0; }\n}"
						}
					]
				}
			},
			{
				"#TEXT": "\n"
			}
		]
	}
}
```

There's also a "compact" mode which gives lighter results:

```javascript
{
	"catalog": {
		"*": [
			{
				"#C": "Source: https://developer.mozilla.org/en-US/docs/JXON#example.xml"
			},
			{
				"product": {
					"description": "Cardigan Sweater",
					"*": [
						{
							"catalog_item": {
								"gender": "Men's",
								"*": [
									{
										"item_number": {
											"*": [
												{
													"#T": "QWZ5671"
												}
											]
										}
									},
									{
										"price": {
											"*": [
												{
													"#T": "39.95"
												}
											]
										}
									},
									{
										"size": {
											"description": "Medium",
											"*": [
												{
													"color_swatch": {
														"image": "red_cardigan.jpg",
														"*": [
															{
																"#T": "Red"
															}
														]
													}
												},
												{
													"color_swatch": {
														"image": "burgundy_cardigan.jpg",
														"*": [
															{
																"#T": "Burgundy"
															}
														]
													}
												}
											]
										}
									},
									{
										"size": {
											"description": "Large",
											"*": [
												{
													"color_swatch": {
														"image": "red_cardigan.jpg",
														"*": [
															{
																"#T": "Red"
															}
														]
													}
												},
												{
													"color_swatch": {
														"image": "burgundy_cardigan.jpg",
														"*": [
															{
																"#T": "Burgundy"
															}
														]
													}
												}
											]
										}
									}
								]
							}
						},
						{
							"catalog_item": {
								"gender": "Women's",
								"*": [
									{
										"item_number": {
											"*": [
												{
													"#T": "RRX9856"
												}
											]
										}
									},
									{
										"discount_until": {
											"*": [
												{
													"#T": "Dec 25, 1995"
												}
											]
										}
									},
									{
										"price": {
											"*": [
												{
													"#T": "42.50"
												}
											]
										}
									},
									{
										"size": {
											"description": "Medium",
											"*": [
												{
													"color_swatch": {
														"image": "black_cardigan.jpg",
														"*": [
															{
																"#T": "Black"
															}
														]
													}
												}
											]
										}
									}
								]
							}
						}
					]
				}
			},
			{
				"script": {
					"type": "text/javascript",
					"*": [
						{
							"#D": "function matchwo(a,b) {\n    if (a < b && a < 0) { return 1; }\n    else { return 0; }\n}"
						}
					]
				}
			}
		]
	}
}
```

Enjoy! :)