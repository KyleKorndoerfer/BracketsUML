/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2015 - 2016 S. Kyle Korndoerfer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

/**
 * Module that encapsulates logging of information.
 */
define(function (require, exports, module) {
	"use strict";

	var		_userPreferences 	= require("lib/userPreferences");

	/**
	 * Starts a new logging group.
	 * @param {string} name The name of the logging group.
	 */
	function group(name) {
		console.group("[BracketsUML] " + name);
	}

	/**
	 * End a logging group.
	 */
	function endGroup() {
		console.groupEnd();
	}

	/**
	 * Logging with a little extra flair (ala Chrome)
	 * @param {string} msg The title of the book.
	 */
	function debug(msg) {
		if (_userPreferences.loggingEnabled() === true) {
			console.log("%c[BracketsUML] " + msg, "color:blue");
		}
	}

	/**
	 * Logs the message to the error console.
	 * @param {string} msg The message to log to the error console.
	  */
	function error(msg) {
		console.error("[BracketsUML] " + msg);
	}

	/**
	 * Logs a verbose message to the error console.
	 * @param {string} src The source of the verbose message.
	 * @param {string} msg The message to log to the console.
	 */
	function verbose(src, msg) {
		console.log("%c[BracketsUML] {" + src + "} " + msg, "color:gray");
	}


	// exports
	exports.group = group;
	exports.endGroup = endGroup;

	exports.debug = debug;
	exports.error = error;
	exports.verbose = verbose;
});
