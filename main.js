/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, window */

/** Extension that adds support for generating PlantUML diagrams */
define(function (require, exports, module) {
    "use strict";

    var DocumentManager     = brackets.getModule("document/DocumentManager"),
        EditorManager       = brackets.getModule("editor/EditorManager"),
        WorkspaceManager    = brackets.getModule("view/WorkspaceManager"),
        ExtensionUtils      = brackets.getModule("utils/ExtensionUtils"),
        FileUtils           = brackets.getModule("file/FileUtils"),
        AppInit             = brackets.getModule("utils/AppInit"),
        LanguageManager     = brackets.getModule("language/LanguageManager"),
        MainViewManager     = brackets.getModule("view/MainViewManager"),
        umlEncoder          = require("./lib/umlEncoder"),

        plantumlService     = "http://www.plantuml.com:80/plantuml/png/",
        BRACKETSUML_PREVIEW = "bracketsuml.preview",
        panelHtml           = "<div id='bracketsuml.panel'><h1>Hello</h1></div>",
        panel;


    /**
     * Logging with a little extra flair (ala Chrome)
     * @param {string} msg - The title of the book.
     */
    function log(msg) {
        console.log("%c[BracketsUML] " + msg, "color:blue");
    }// log(msg)


    /**
     * Registers the PlantUML language to the 'wsd' file extension
     */
    function registerLanguage() {
        // register the 'wsd' file extension/language
        // (simple for the moment; syntax highlighting coming later)
        LanguageManager.defineLanguage("plantuml", {
            name: "PlantUML Diagram",
            mime: "text/plain",
            mode: "null",
            fileExtensions: ["wsd"],
            lineComment: ["'"]
        });
    }// registerLanguage()


    /**
     * Shows the diagram preview panel if not already shown
     */
    function showPreviewPanel() {
        if (!panel.isVisible()) {
            log("Showing the preview panel");
            // TODO: refresh panel with local file content; if available
            //panel.show();
        }
    }// showPreviewPanel()

    /** Hides the diagram preview panel if not already hidden */
    function hidePreviewPanel() {
        if (panel.isVisible()) {
            log("Hiding the preview panel");
            panel.hide();
        }
    }//hidePreviewPanel()

    /** Updates the preview panel image based on the editor contents */
    function updatePanel(editor) {
        var text = editor.document.getText();
        log("Straight text: " + text);
        log("Encoded text: " + umlEncoder.compress(text));
        // TODO: make a call to PlantUML REST API to get an image back
        // TODO: save the image to disk (same file name, different extension
        // TODO: refresh the panel to show the latest image
    }// updatePanel(editor)

    /** Updates the diagram preview panel in response to the document being updated. */
    function handleFileSaved(jqEvent, doc) {
        console.assert(EditorManager.getCurrentFullEditor() && EditorManager.getCurrentFullEditor().document === doc);
        updatePanel(EditorManager.getCurrentFullEditor());
        log("File saved");
    }//handleFileSaved(jqEvent, doc)

    /** Shows/hides the diagram preview panel based on the active editor */
    function handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId) {
        var newEditor = EditorManager.getCurrentFullEditor();
        if (newEditor) {
            if (newEditor.document.getLanguage().getId() === "plantuml") {
                DocumentManager.on("documentSaved", handleFileSaved);
                showPreviewPanel();
            } else {
                DocumentManager.off("documentSaved", handleFileSaved);
                hidePreviewPanel();
            }
        } else {
            hidePreviewPanel();
        }
    }// handleCurrentEditorChange()

    /** Registers and global event listeners */
    function registerEventListeners() {
        // listen for changes to the active editor
        MainViewManager.on("currentFileChange", handleCurrentEditorChange);
    }// registerEventListeners()

    AppInit.appReady(function () {
        log("Initializing...");
        registerLanguage();
        registerEventListeners();

        panel = WorkspaceManager.createBottomPanel(BRACKETSUML_PREVIEW, $(panelHtml), 300);

        log("Initialized");
    });
});