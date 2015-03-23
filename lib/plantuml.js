/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Extension that adds support for generating PlantUML diagrams */
define(function (require, exports, module) {
    "use strict";

    var register = function (CodeMirror) {
        CodeMirror.defineMode("plantuml", function (config) {
			/* STYLES: * comment atom number property keyword string variable variable-2 def bracket tag link error */
			return {
				startState: function () {
					return {
						inKeyword: false,
						inArrow: false,
						inBox: false,
						inLoop: false,
						inAlt: false
					};
				},// startState

				token: function (stream, state) {
					stream.eatSpace();	// eat any leading whitespace

					if (stream.peek() === "'") {
						stream.skipToEnd();
						return "comment";
					} else if (stream.match(/@startuml|@enduml/)) {
						stream.skipToEnd();
						return "atom";
					} else if (stream.match(/title|actor/)) {
						state.inKeyword = true;
						stream.skipTo(" ");
						return "keyword";
					}

					if (state.inKeyword) {
						stream.skipToEnd();
						state.inKeyword = false;
						return null;
					} else {
						// no further processing of the line; skip to end
						stream.skipToEnd();
						return null;	// unstyled text
					}
				},// token

				lineComment: "'",
				blockCommentStart: "/'",
				blockCommentEnd: "'/"
			};
        });//CodeMirror.defineMode(...)

        CodeMirror.defineMIME("text/x-plantuml", "plantuml");
    };// register(CodeMirror)

    // Exports only the compress function
    exports.register = register;
});
