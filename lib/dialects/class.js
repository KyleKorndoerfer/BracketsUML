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

/** Extension that adds support for generating PlantUML diagrams */
define(function (require, exports, module) {
    "use strict";

	var CodeMirror		=	brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
		LanguageManager	=	brackets.getModule("language/LanguageManager"),

		_logger			=	require("lib/logging"),
		_constants		=	require("lib/constants"),
		_mode			=	"plantuml-class",
		_mime			=	"text/x-plantuml-class";


	/** Defines the CodeMirror mode (syntax highlighting) for the dialect. */
	function defineMode() {
		CodeMirror.defineMode(_mode, function (config) {
			return {
				startState: function () {
					return {
						indentLevel: 0,
						inComment: false,
						inString: false,
						inNote: false
					};
				}, // startState

				indent: function (state, textAfter) {
					return state.indentLevel * 4;	// TODO: should take into account CodeMirror indentUnit property
				}, // indent(state, textAfter)

				token: function (stream, state) {
					stream.eatSpace();	// eat any leading whitespace

					/* identitfy if we are starting a new 'mode'
					 ****************************************************/
					if (!state.inComment && !state.inString && !state.inNote) {
						if (stream.peek() === "'") {
							// start of single line comment; read to EOL
							stream.skipToEnd();
							return _constants.CodeMirror.comment;
						} else if (stream.match(/\/'/)) {
							// start of multi-line comment
							state.inComment = true;
							state.indentLevel += 1;
						} else if (stream.peek() === '"') {
							// start of string
							state.inString = true;
							stream.next();	// eat the '"' character
						} else if (stream.match(/@startuml|@enduml/)) {
							// beginning or end of the diagrams
							stream.skipToEnd();
							return _constants.CodeMirror.def;
						} else if (stream.match(/abstract\sclass|abstract|class|interface|annotation|enum|\{static\}|\{abstract\}/)) {
							// keywords
							stream.skipTo(' ') || stream.skipToEnd();
							return _constants.CodeMirror.keyword;
						} else if (stream.match(/(?:note\s(?:top|bottom|left|right)\sof)|note/)) {
							// notes
							state.inNote = true;
							stream.skipTo(' ');	// space after 'note'
							return _constants.CodeMirror.keyword;
						}
					}

					/* take action based on current 'mode'
					 ****************************************************/
					if (state.inComment) {
						// inside multi-line comment
						if (stream.match(/.*'\//)) {
							state.inComment = false;		// closing found on this line
							state.indentLevel -= 1;
						} else {
							stream.skipToEnd();				// still in multi-line comment
						}
						return _constants.CodeMirror.comment;
					} else if (state.inString) {
						// inside a string
						if (stream.skipTo('"')) {			// closing found on the same line
							stream.next();
							state.inString = false;
						} else {
							stream.skipToEnd();
						}
						return _constants.CodeMirror.string;
					} else if (state.inNote) {
						if (stream.match(/\:/)) {
							state.inNote = false;
							stream.skipToEnd();
							return null;
						}
						
						stream.skipTo(' ');
						return null;
					} else {
						// no further processing needed; skip to next space or end
						stream.skipTo(' ') || stream.skipToEnd();
						return null;		// unstyled text
					}
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
		LanguageManager.defineLanguage("plantuml_class", {
			name: "PlantUML Diagram (Class)",
			mime: _mime,
			mode: _mode,
			fileExtensions: ["pclass"],
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