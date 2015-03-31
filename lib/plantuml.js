/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Extension that adds support for generating PlantUML diagrams */
define(function (require, exports, module) {
    "use strict";

    var register = function (CodeMirror) {
        CodeMirror.defineMode("plantuml", function (config) {
			return {
				startState: function () {
					return {
						indentLevel: 0,
						inComment: false,
						inString: false,
						inColor: false,
						inBox: false,
						inNote: false
					};
				},// startState()

				indent: function (state, textAfter) {
					if (state.inBox || state.inNote) {
						return state.indentLevel * 4;	// TODO: should take into account CodeMirror indentUnit property
					}
				},// indent(state, textAfter)

				token: function (stream, state) {
					stream.eatSpace();	// eat any leading whitespace

					/* identify if we are starting a new 'mode'
					 ****************************************************/
					if (!state.inComment && !state.inString) {
						if (stream.peek() === "'") {
							// start of single line comment; read to EOL
							stream.skipToEnd();
							return "comment";
						} else if (stream.match(/\/'/)) {
							// start of multi-line comment
							state.inComment = true;
							state.indentLevel += 1;
						} else if (stream.peek() === '"') {
							// start of string
							state.inString = true;
							stream.next();	// eat the '"' character
						} else if (stream.match(/@startuml|@enduml/)) {
							// beginning or end of the diagram
							stream.skipToEnd();
							return "def";
						} else if (stream.match(/\=\=|\|\|\||\.\.\./)) {
							// divider, space, or delay
							stream.skipTo(' ');
							return "def";
						} else if (stream.peek() === '#') {
							// start of a color definition
							state.inColor = true;
							stream.next();
						} else if (stream.match(/title|create|actor|boundary|control|database|entity|participant|activate|deactivate|destroy|autonumber/)) {
							stream.skipTo(' ') || stream.skipToEnd();
							return "keyword";
						} else if (stream.match(/box/)) {
							state.inBox = true;
							state.indentLevel += 1;
							stream.skipTo(' ') || stream.skipToEnd();
							return "keyword";
						} else if (stream.match(/[hr]?note\s(over|left|right)?/)) {
							// start of a note construct
							state.inNote = true;
							state.indentLevel += 1;
							return "keyword";
						} else if (stream.match(/(alt|else|group|loop|critical|break|ref over|legend(\s(left|center|right))?)\s/)) {
							state.inGroup = true;
							state.indentLevel += 1;
							return "keyword";
						} else if (stream.match(/([\-]{1,2}((>(x|>|o|\\)?)|(\\){1,2}|(\/){1,2}))|((\/|\\){1,2}-{1,2})|(o<-{1,2}(>(o)?)?)|(x<-{1,2})|((<<-{1,2})|(<-{1,2}(>o?)?))/)) {
							// arrow
							stream.next();
							return "atom";
						}
					}

					/* take action based on current 'mode'
					 ****************************************************/
					if (state.inComment) {
						// inside multi-line comment
						if (stream.match(/.*'\//)) {
							state.inComment = false;	// closing found on this line
							state.indentLevel -= 1;
						} else {
							stream.skipToEnd();			// read rest of the line
						}
						return "comment";
					} else if (state.inString) {
						// inside a string
						if (stream.skipTo('"')) {		// closing found on the same line
							stream.next();
							state.inString = false;
						} else {
							stream.skipToEnd();
						}
						return "string";
					} else if (state.inColor) {
						// inside a color definition
						state.inColor = false;
						stream.skipTo(' ') || stream.skipToEnd();
						return "number";
					} else if (state.inBox && stream.match(/end\s?box/)) {
						// closing of box construct
						state.inBox = false;
						state.indentLevel -= 1;
						return "keyword";
					} else if (state.inNote && stream.match(/end\s?note/)) {
						// closing of note construct
						state.inNote = false;
						state.indentLevel -= 1;
						return "keyword";
					} else if (state.inGroup && stream.match(/end((\sref)?|(legend))?/)) {
						// closing of group
						state.indentLevel -= 1;
						state.inGroup = state.indentLevel !== 0;
						return "keyword";
					} else {
						// no further processing needed; skip to next space or end
						stream.skipTo(' ') || stream.skipToEnd();
						return null;		// unstyled text
					}
				},// token(stream, state)

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
