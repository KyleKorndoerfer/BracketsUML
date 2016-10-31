/**
 * Module that encapsulates logging of information.
 */
define(function (require, exports, module) {
	"use strict";

	var		_userPreferences 	= require("lib/userPreferences");

	/**
	 * Logging with a little extra flair (ala Chrome)
	 * @param {string} msg The title of the book.
	 */
	function log(msg) {
		if (_userPreferences.loggingEnabled() === true) {
			console.log("%c[BracketsUML] " + msg, "color:blue");
		}
	}

	/**
	 * Logs the message to the error console.
	 * @param {string} msg The message to log to the error console.
	  */
	function logError(msg) {
		console.error("[BracketsUML] " + msg);
	}


	// exports
	exports.log = log;
	exports.logError = logError;
});