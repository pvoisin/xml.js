# XML.js
## What for?
XML.js provides helper functions for XML manipulation, including conversion of documents into [JXON](https://developer.mozilla.org/en-US/docs/JXON) objects.
It is built on top of [xmldom](https://www.npmjs.org/package/xmldom) & [xpath](https://www.npmjs.org/package/xpath) modules and brings common XML-related features together into a simplistic API.

## API

### XML#parse
```javascript
function parse(text) { ... //-> DOMDocument
```

### XML#load
```javascript
function load(file, [convert:false]) { ... //-> DOMDocument
```

### XML#serialize
```javascript
function serialize(node) { ... //-> String
```

### XML#query
```javascript
function query(node, expression, resolver) { ... //-> [Node]
```

####Example
```javascript
XML.query(catalog, "//book[1]");
XML.query(response, "//here:contact[1]",  {"here": "http://being.here/"});
```



## JXON

### convert
```javascript
function convert(node, [compact:true]) { ... //-> {Object}
```

####Example
Given `document` is the following:
```xml
<contact firstName="George" lastName="Cartier">
    <notes>
        <![CDATA[
            Will call back tomorrow.
        ]]>
    </notes>
</contact>
```
Resulting JXON object, converted with `JXON.convert(document)`, would be:
<a name="JXON_convert_result"></a>
```javascript
{
	"contact": {
		"firstName": "George",
		"lastName": "Cartier",
		"*": {
			"notes": {
				"*": {
					"#D": "Will call back tomorrow."
				}
			}
		}
	}
}
```

### compact
```javascript
function compact(object) { ... //-> {Object}
```
####Example
When not compacted, [previous result](#JXON_convert_result) would be the following, which could be compacted afterwards with `JXON#compact`:
```javascript
{
	"contact": {
		"@firstName": "George",
		"@lastName": "Cartier",
		"children": [
			{
				"#TEXT": "\n            "
			},
			{
				"notes": {
					"children": [
						{
							"#TEXT": "\n                "
						},
						{
							"#CDATA": "\n                    Will call back tomorrow.\n                "
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
}
```

## More?

Please have a look to the test [fixtures](test/fixtures)!