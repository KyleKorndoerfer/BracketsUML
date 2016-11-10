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

/** PlantUML Diagram: Object dialect */
define(function (require, exports, module){
	"use strict";

	var CodeMirror		=	brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
		LanguageManager	=	brackets.getModule("language/LanguageManager"),

		_logger			=	require("lib/logging"),
		_mode			=	"plantuml-object",
		_mime			=	"text/x-plantuml-object";


	/** Defines the CodeMirror mode (syntax highlighting) for the dialect. */
	function defineMode() {
		CodeMirror.defineMode(_mode, function (config) {
			return {
				startState: function () {
					return {
						indentLevel: 0
					};
				}, // startState

				indent: function (state, tetAfter) {
					// some conditional check for new indent level
						// return state.indentLevel * 4;
				}, // indent(state, textAfter)

				token: function (stream, state) {
					stream.eatSpace();	// eat any leading whitespace

					/* identitfy if we are starting a new 'mode'
					 ****************************************************/

					/* take action based on current 'mode'
					 ****************************************************/

					// TEMPORARY; no syntax support yet
					stream.skipToEnd();
					return null;
				}, // token(stream, state)

				lineComment: "'",
				blockCommentStart: "/'",
				blockCommentEnd: "'/"
			};
		});  // CodeMirror.defineMode(...)
	}

	/** Defines the MIME type(s) for the dialect. */
	function defineMime() {
		CodeMirror.defineMIME(_mime, _mode)
	}

	/** Registers the language dialect with the Brackets Language Manager. */
	function defineLanguage() {
		LanguageManager.defineLanguage("plantuml_object", {
			name: "PlantUML Diagram (Object)",
			mime: _mime,
			mode: _mode,
			fileExtensions: ["pobj"],
			lineComment: ["'"]
		}).done(function (language) {
			_logger.debug("... Language " + language.getName() + " registered");
		});
	}

	/** Registers the language dialect. */
	function init() {
		defineMode();
		defineMime();
		defineLanguage();
	}

	// exports
	exports.init = init;
})