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

/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, Mustache, $, brackets, window */

/**
 * Extension that adds support for generating PlantUML diagrams.
 */
define(function (require, exports, module) {
	"use strict";

	var DEBUG				= true,

		AppInit				= brackets.getModule("utils/AppInit"),
		CodeMirror			= brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
		CommandManager		= brackets.getModule("command/CommandManager"),
		DocumentManager		= brackets.getModule("document/DocumentManager"),
		EditorManager		= brackets.getModule("editor/EditorManager"),
		ExtensionUtils		= brackets.getModule("utils/ExtensionUtils"),
		FileUtils			= brackets.getModule("file/FileUtils"),
		LanguageManager		= brackets.getModule("language/LanguageManager"),
		MainViewManager		= brackets.getModule("view/MainViewManager"),
		Menus				= brackets.getModule("command/Menus"),
		NodeDomain			= brackets.getModule("utils/NodeDomain"),
		PrefsManager		= brackets.getModule("preferences/PreferencesManager"),
		WorkspaceManager	= brackets.getModule("view/WorkspaceManager"),

		Diagram				= new NodeDomain("saveDiagram", ExtensionUtils.getModulePath(module, "node/saveDiagram")),

		plantUmlLang		= require("./lib/plantuml"),
		panelTemplate		= require("text!previewPanel.html"),
		umlEncoder			= require("./lib/umlEncoder"),
		loadingImageUrl		= require.toUrl('./images/loading-gray.gif'),

		plantumlService		= "http://www.plantuml.com/plantuml/png/",
		BRACKETSUML_COMMAND	= "bracketsuml.command",
		BRACKETSUML_PREVIEW	= "bracketsuml.preview",
		loadingImage,
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
		console.error("[BracketsUML] " + msg);
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
			CommandManager.get(BRACKETSUML_COMMAND).setChecked(true);
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
			CommandManager.get(BRACKETSUML_COMMAND).setChecked(false);
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

		$("img.preview", panel.$panel).attr("src", filename + "?d=" + Date.now());
		showPreviewPanel();

		log("END: updatePanel()");
	}// updatePanel()


	/**
	 * Refreshes the image generated from the text in the editor.
	 * @param {Object} jqEvent The jQuery event object.
	 */
	function refreshDiagram(jqEvent) {
		log("BEGIN: refreshDiagram()");
		loadingImage.show();

		// build the file path
		var encodedUrl = getEncodedUrl(),
			filename = FileUtils.convertToNativePath(getImageFilePath());


		Diagram.exec("save", encodedUrl, filename, PrefsManager.get("proxy"))
			.done(function () {
				log("Diagram successfully saved");

				updatePanel(filename);
				loadingImage.hide();
			}).fail(function (err) {
				logError("Diagram was not saved properly: " + err);
				loadingImage.hide();
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
	 * Handles the user clicking on the menu item to show/hide the preview panel.
	 */
	function handleShowHideCommand() {
		if (panel.isVisible()) {
			hidePreviewPanel();
		} else {
			showPreviewPanel();
		}
	}// handleShowHideCommand()

	/**
	 * Enables the 'Preview' menu command for showing/hiding the preview panel.
	 */
	function enableMenuCommand() {
		CommandManager.get(BRACKETSUML_COMMAND).setEnabled(true);
	}// enableMenuCommand()

	/**
	 * Disables the  'Preview' menu command for showing/hiding the preview panel.
	 */
	function disableMenuCommand() {
		if (CommandManager.get(BRACKETSUML_COMMAND) !== undefined) {
			CommandManager.get(BRACKETSUML_COMMAND).setEnabled(false);
		}
	}// disableMenuCommand()

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
				enableMenuCommand();
				showPreviewPanel();
			} else {
				DocumentManager.off("documentSaved", handleFileSaved);
				editor = null;
				disableMenuCommand();
				hidePreviewPanel();
			}
		} else {
			disableMenuCommand();
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
	 * Initializes the preview panel
	 */
	function initPreviewPanel() {
		panel = WorkspaceManager.createBottomPanel(BRACKETSUML_PREVIEW, $(panelTemplate), 150);

		loadingImage = $("img.loading", panel.$panel);
		loadingImage.attr('src', loadingImageUrl);
		loadingImage.hide();
	}// initPreviewPanel()

	/**
	 * Initializes the extension.
	 */
	AppInit.appReady(function () {
		log("Initializing...");

		registerLanguage();
		initPreviewPanel();
		registerEventListeners();
		// Add preview menu item
		CommandManager.register("BracketsUML Preview Panel", BRACKETSUML_COMMAND, handleShowHideCommand);
		Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(BRACKETSUML_COMMAND);

		// FUTURE: Add toolbar icon to show/hide panel?

		log("Initialized");
	});
});
