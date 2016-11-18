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
 * Defines a list of constants used in the extension.
 */
define(function(require, exports, module) {
	"use strict";

	exports.DefaultPlantumlService	= "http://www.plantuml.com/plantuml/png/"

	exports.Commands = {
		command: "bracketsuml.command",
		preview: "bracketsuml.preview"
	};

	exports.Preferences	= {
		serviceUrl: "plantUMLServiceUrl",
		loggingEnabled: "loggingEnabled"
	};

	exports.CodeMirror = {
		keyword: "keyword",
		atom: "atom",
		number: "number",
		def: "def",
		variable: "variable",
		punctuation: "punctuation",
		property: "property",
		operator: "operator",
		variable2: "variable-2",
		variable3: "variable-3",
		comment: "comment",
		string: "string",
		string2: "string-2",
		meta: "meta",
		qualifier: "qualifier",
		builtin: "builtin",
		bracket: "bracket",
		tag: "tag",
		attribute: "attribute",
		hr: "hr",
		link: "link"
	}
});
