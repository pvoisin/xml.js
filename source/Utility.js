var helper = require("lodash");
var XRegExp = require("xregexp").XRegExp;

helper.mixin({
	capitalize: function capitalize(text) {
		return text.charAt(0).toUpperCase() + text.slice(1);
	},

	camelize: function camelize(text) {
		return text.replace(XRegExp("[^\\p{L}\\d]+([\\p{L}\\d])", "g"), function(match, letter/*, offset, text*/) {
			return letter.toUpperCase();
		});
	},

	isDefined: function isDefined() {
		return !helper.isUndefined.apply(this, arguments);
	}
});

module.exports = helper;