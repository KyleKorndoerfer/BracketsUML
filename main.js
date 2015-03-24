/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, Mustache, $, brackets, window */

/**
 * Extension that adds support for generating PlantUML diagrams.
 */
define(function (require, exports, module) {
    "use strict";

    var DEBUG				= true,
		DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        WorkspaceManager    = brackets.getModule("view/WorkspaceManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        AppInit             = brackets.getModule("utils/AppInit"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        MainViewManager     = brackets.getModule("view/MainViewManager"),
        CodeMirror          = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        umlEncoder          = require("./lib/umlEncoder"),
        plantUmlLang        = require("./lib/plantuml"),

        plantumlService     = "http://www.plantuml.com:80/plantuml/png/",
        BRACKETSUML_PREVIEW = "bracketsuml.preview",
        panelTemplate       = require("text!previewPanel.html"),
        panel;


    /**
     * Logging with a little extra flair (ala Chrome)
     * @param {string} msg - The title of the book.
     */
    function log(msg) {
		if (DEBUG) {
			console.log("%c[BracketsUML] " + msg, "color:blue");
		}
    }// log(msg)


    /**
     * Registers the PlantUML language syntax
     */
    function registerLanguage() {
		log("BEGIN: registerLanguage()");

        // create a new 'plantuml' language mode in CodeMirror
        plantUmlLang.register(CodeMirror);

        // register the 'wsd' file extension/language
        // (simple for the moment; syntax highlighting coming later)
        LanguageManager.defineLanguage("plantuml", {
            name: "PlantUML Diagram",
            mime: "text/x-plantuml",
            mode: "plantuml",
            fileExtensions: ["plantuml", "uml", "wsd"],
            lineComment: ["'"]
        });

		log("END: registerLanguage()");
    }// registerLanguage()


    /**
     * Shows the diagram preview panel if not already shown
     */
    function showPreviewPanel() {
		log("BEGIN: showPreviewPanel()");

        if (!panel.isVisible()) {
            log("Showing the preview panel");
            // TODO: refresh panel with local file content; if available
            panel.show();
        }

		log("END: showPreviewPanel()");
    }// showPreviewPanel()

    /**
	 * Hides the diagram preview panel if not already hidden.
	 */
    function hidePreviewPanel() {
		log("BEGIN: hidePreviewPanel()");

        if (panel.isVisible()) {
            log("Hiding the preview panel");
            panel.hide();
        }

		log("END: hidePreviewPanel()");
    }//hidePreviewPanel()

    /**
	 * Updates the preview panel image based on the editor contents.
	 */
    function updatePanel(editor) {
		log("BEGIN: updatePanel(editor)");

		if (editor && editor.document) {
			var encodedText = umlEncoder.compress(editor.document.getText());
			log("Encoded text: " + encodedText);

			// TODO: save the image to disk (same file name, different extension
			$("img", panel.$panel).attr("src", plantumlService + encodedText);

			showPreviewPanel();
		}

		log("END: updatePanel(editor)");
    }// updatePanel(editor)


    /**
	 * Updates the diagram preview panel in response to the document being updated.
	 */
    function handleFileSaved(jqEvent, doc) {
		log("BEGIN: handleFileSaved(jqEvent, doc)");

		var currentEditor = EditorManager.getCurrentFullEditor();
        console.assert(currentEditor && currentEditor.document === doc);
        updatePanel(currentEditor);

		log("END: handleFileSaved(jqEvent, doc)");
    }//handleFileSaved(jqEvent, doc)


    /**
	 * Handles the active document being changed by showing/hiding the diagram
	 * preview panel based on language in the active editor.
	 */
    function handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId) {
		log("BEGIN: handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId)");

        var newEditor = EditorManager.getCurrentFullEditor();
        if (newEditor) {
            if (newEditor.document.getLanguage().getId() === "plantuml") {
                DocumentManager.on("documentSaved", handleFileSaved);
                updatePanel();
            } else {
                DocumentManager.off("documentSaved", handleFileSaved);
                hidePreviewPanel();
            }
        } else {
            hidePreviewPanel();
        }

		log("END: handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId)");
    }// handleCurrentEditorChange()


    /** Registers and global event listeners */
    function registerEventListeners() {
		log("BEGIN: registerEventListeners()");

        // listen for changes to the active editor
        MainViewManager.on("currentFileChange", handleCurrentEditorChange);

		// Close panel when close button is clicked.
		panel.$panel.on('click', '.close', hidePreviewPanel);

		log("END: registerEventListeners()");
    }// registerEventListeners()


	AppInit.appReady(function () {
        log("Initializing...");

		registerLanguage();
        panel = WorkspaceManager.createBottomPanel(BRACKETSUML_PREVIEW, $(panelTemplate), 150);
		registerEventListeners();

        log("Initialized");
    });
});
