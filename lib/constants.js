/**
 * Defines a list of constants used in the extension.
 */
define(function(require, exports, module) {
	"use strict";

	exports.Commands = {
		command: "bracketsuml.command",
		preview: "bracketsuml.preview"
	};

	exports.Preferences	= {
		serviceUrl: "plantUMLServiceUrl",
		loggingEnabled: "loggingEnabled"
	};

	exports.DefaultPlantumlService	= "http://www.plantuml.com/plantuml/png/"
});
