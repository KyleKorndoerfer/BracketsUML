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
		NodeDomain			= brackets.getModule("utils/NodeDomain"),
		PrefsManager		= brackets.getModule("preferences/PreferencesManager"),

		Diagram				= new NodeDomain("saveDiagram", ExtensionUtils.getModulePath(module, "node/saveDiagram")),

        umlEncoder          = require("./lib/umlEncoder"),
        plantUmlLang        = require("./lib/plantuml"),
		panelTemplate       = require("text!previewPanel.html"),

        plantumlService     = "http://www.plantuml.com/plantuml/png/",
        BRACKETSUML_PREVIEW = "bracketsuml.preview",
        panel,
		editor;


    /**
     * Logging with a little extra flair (ala Chrome)
     * @param {string} msg The title of the book.
     */
    function log(msg) {
		if (DEBUG) {
			console.log("%c[BracketsUML] " + msg, "color:blue");
		}
    }// log(msg)

	/**
	 * Logs the message to the error console.
	 * @param {string} msg The message to log to the error console.
	  */
	function logError(msg) {
	}// logError(msg)


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
            fileExtensions: ["puml", "wsd"],
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
	 * @param {Editor} editor The active editor instance
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
	 * @param {Object} jqEvent The jQuery event object.
	 * @param {Document} doc The active document.
	 */
    function handleFileSaved(jqEvent, doc) {
		log("BEGIN: handleFileSaved(jqEvent, doc)");

		//var currentEditor = EditorManager.getCurrentFullEditor();
        //console.assert(currentEditor && currentEditor.document === doc);
        //updatePanel(currentEditor);

		console.assert(editor && editor.document === doc);
		updatePanel(editor);

		log("END: handleFileSaved(jqEvent, doc)");
    }//handleFileSaved(jqEvent, doc)


    /**
	 * Handles the active document being changed by showing/hiding the diagram
	 * preview panel based on language in the active editor.
	 * @param {Object} jqEvent The jQuery event object.
	 * @param {File} newFile
	 * @param {string} newPaneId
	 * @param {File} oldFile
	 * @param {string} oldPaneId
	 */
    function handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId) {
		log("BEGIN: handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId)");

        var newEditor = EditorManager.getCurrentFullEditor();
        if (newEditor) {
            if (newEditor.document.getLanguage().getId() === "plantuml") {
                DocumentManager.on("documentSaved", handleFileSaved);
				editor = newEditor;
                updatePanel();
            } else {
                DocumentManager.off("documentSaved", handleFileSaved);
				editor = null;
                hidePreviewPanel();
            }
        } else {
            hidePreviewPanel();
        }

		log("END: handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId)");
    }// handleCurrentEditorChange()

	/**
	 * Saves the image generated from the text in the editor.
	 * @param {Object} jqEvent The jQuery event object.
	 */
	function saveDiagram(jqEvent) {
		log("BEGIN: saveDiagram()");

		var fullPath = editor.document.file.fullPath,
			encodedText = umlEncoder.compress(editor.document.getText()),
			fullUrl = plantumlService + encodedText,
			filename;

		// build the file path
		filename = FileUtils.getDirectoryPath(fullPath);
		filename += FileUtils.getFilenameWithoutExtension(editor.document.file.name);
		filename += ".png";

		Diagram.exec("save", fullUrl, FileUtils.convertToNativePath(filename), PrefsManager.get("proxy"))
			.done(function () {
				log("Diagram successfully saved");
			}).fail(function (err) {
				logError("Diagram was not saved properly: " + err);
			});

		log("END: saveDiagram()");
	}// saveDiagram(jqEvent)

    /**
	 * Registers and global event listeners
	 */
    function registerEventListeners() {
		log("BEGIN: registerEventListeners()");

        // listen for changes to the active editor
        MainViewManager.on("currentFileChange", handleCurrentEditorChange);

		// Close panel when close button is clicked.
		panel.$panel.on('click', '.close', hidePreviewPanel);
		// Save file when save button clicked
		panel.$panel.on('click', '.save', saveDiagram);

		log("END: registerEventListeners()");
    }// registerEventListeners()


	/**
	 * Initializes the extension.
	 */
	AppInit.appReady(function () {
        log("Initializing...");

		registerLanguage();
        panel = WorkspaceManager.createBottomPanel(BRACKETSUML_PREVIEW, $(panelTemplate), 150);
		registerEventListeners();

		// FUTURE: Add icon to the toolbar on the right?

        log("Initialized");
    });
});
