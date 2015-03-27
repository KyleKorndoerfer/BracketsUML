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
     * Gets the full file path to the active document.
     * @return {string} The full file path to the current document.
     */
    function getFullFilePath() {
		return editor.document.file.fullPath;
    }

    /**
     * Gets the fully encode url to the diagram.
     * @return {string} Full service URL to generate the diagram
     */
    function getEncodedUrl() {
		return plantumlService + umlEncoder.compress(editor.document.getText());
    }

    /**
     * builds the full path to the resulting image.
     * @return {string} The full path to the resulting image file
     */
    function getImageFilePath() {
		var imageName = FileUtils.getDirectoryPath(getFullFilePath());
		imageName += FileUtils.getFilenameWithoutExtension(editor.document.file.name);
		imageName += ".png";

		return imageName;
    }

    /**
	 * Updates the preview panel image based on the editor contents.
	 */
    function updatePanel(filename) {
		log("BEGIN: updatePanel(editor)");

		$("img", panel.$panel).attr("src", filename);
		showPreviewPanel();

		log("END: updatePanel()");
    }// updatePanel()


    /**
	 * Refreshes the image generated from the text in the editor.
	 * @param {Object} jqEvent The jQuery event object.
	 */
	function refreshDiagram(jqEvent) {
		log("BEGIN: refreshDiagram()");

		// build the file path
		var encodedUrl = getEncodedUrl(),
			filename = FileUtils.convertToNativePath(getImageFilePath());


		Diagram.exec("save", encodedUrl, filename, PrefsManager.get("proxy"))
			.done(function () {
				log("Diagram successfully saved");

				// FIXME: Replace with a filesystem watcher?
				setTimeout(function () {
					updatePanel(filename);
				}, 1500);
			}).fail(function (err) {
				logError("Diagram was not saved properly: " + err);
			});

		log("END: refreshDiagram()");
	}// refreshDiagram(jqEvent)


	/**
	 * Updates the diagram preview panel in response to the document being updated.
	 * @param {Object} jqEvent The jQuery event object.
	 * @param {Document} doc The active document.
	 */
    function handleFileSaved(jqEvent, doc) {
		log("BEGIN: handleFileSaved(jqEvent, doc)");

		console.assert(editor && editor.document === doc);
		refreshDiagram();

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
                showPreviewPanel();
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
	 * Registers and global event listeners
	 */
    function registerEventListeners() {
		log("BEGIN: registerEventListeners()");

        // listen for changes to the active editor
        MainViewManager.on("currentFileChange", handleCurrentEditorChange);

		// Close panel when close button is clicked.
		panel.$panel.on('click', '.close', hidePreviewPanel);
		// Refresh file when 'refresh' button clicked
		panel.$panel.on('click', '.refresh', refreshDiagram);

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
