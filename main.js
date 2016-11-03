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

	var
		AppInit					= brackets.getModule("utils/AppInit"),
		CodeMirror				= brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
		CommandManager			= brackets.getModule("command/CommandManager"),
		DocumentManager			= brackets.getModule("document/DocumentManager"),
		EditorManager			= brackets.getModule("editor/EditorManager"),
		ExtensionUtils			= brackets.getModule("utils/ExtensionUtils"),
		FileUtils				= brackets.getModule("file/FileUtils"),
		LanguageManager			= brackets.getModule("language/LanguageManager"),
		MainViewManager			= brackets.getModule("view/MainViewManager"),
		Menus					= brackets.getModule("command/Menus"),
		NodeDomain				= brackets.getModule("utils/NodeDomain"),
		// need to refactor so all preferences go into a seprate module
		WorkspaceManager		= brackets.getModule("view/WorkspaceManager"),

		Diagram					= new NodeDomain("saveDiagram", ExtensionUtils.getModulePath(module, "node/saveDiagram")),

		plantUmlLang			= require("lib/plantuml"),
		panelTemplate			= require("text!previewPanel.html"),
		umlEncoder				= require("lib/umlEncoder"),
		loadingImageUrl			= require.toUrl('./images/loading-gray.gif'),
		_preferences			= require("lib/userPreferences"),
		_logger					= require("lib/logging"),
		_constants				= require("lib/constants"),

		loadingImage,
		panel,
		editor;


	/**
	 * Registers the PlantUML language syntax
	 */
	function registerLanguage() {
		_logger.log("BEGIN: registerLanguage()");

		// create a new 'plantuml' language mode in CodeMirror
		plantUmlLang.register(CodeMirror);

		// register the 'wsd' file extension/language
		// (simple for the moment; syntax highlighting coming later)
		LanguageManager.defineLanguage("plantuml", {
			name: "PlantUML Diagram",
			mime: "text/x-plantuml",
			mode: "plantuml",
			fileExtensions: ["puml", "wsd", "pseq"],
			lineComment: ["'"]
		});

		_logger.log("END: registerLanguage()");
	}// registerLanguage()


	/**
	 * Shows the diagram preview panel if not already shown
	 */
	function showPreviewPanel() {
		_logger.log("BEGIN: showPreviewPanel()");

		if (!panel.isVisible()) {
			_logger.log("Showing the preview panel");
			panel.show();
			CommandManager.get(_constants.Commands.command).setChecked(true);
		}

		_logger.log("END: showPreviewPanel()");
	}// showPreviewPanel()

	/**
	 * Hides the diagram preview panel if not already hidden.
	 */
	function hidePreviewPanel() {
		_logger.log("BEGIN: hidePreviewPanel()");

		if (panel.isVisible()) {
			_logger.log("Hiding the preview panel");
			panel.hide();
			CommandManager.get(_constants.Commands.command).setChecked(false);
		}

		_logger.log("END: hidePreviewPanel()");
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
		return _preferences.serviceUrl() + umlEncoder.compress(editor.document.getText());
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
		_logger.log("BEGIN: updatePanel(editor)");

		$("img.preview", panel.$panel).attr("src", filename + "?d=" + Date.now());
		showPreviewPanel();

		_logger.log("END: updatePanel()");
	}// updatePanel()


	/**
	 * Refreshes the image generated from the text in the editor.
	 * @param {Object} jqEvent The jQuery event object.
	 */
	function refreshDiagram(jqEvent) {
		_logger.log("BEGIN: refreshDiagram()");
		loadingImage.show();

		// build the file path
		var encodedUrl = getEncodedUrl(),
			filename = FileUtils.convertToNativePath(getImageFilePath());

		_logger.log("ENCODED URL: " + encodedUrl);
		Diagram.exec("save", encodedUrl, filename, _preferences.proxy)
			.done(function () {
				_logger.log("Diagram successfully saved");

				updatePanel(filename);
				loadingImage.hide();
			}).fail(function (err) {
				_logger.logError("Diagram was not saved properly: " + err);
				loadingImage.hide();
			});

		_logger.log("END: refreshDiagram()");
	}// refreshDiagram(jqEvent)


	/**
	 * Updates the diagram preview panel in response to the document being updated.
	 * @param {Object} jqEvent The jQuery event object.
	 * @param {Document} doc The active document.
	 */
	function handleFileSaved(jqEvent, doc) {
		_logger.log("BEGIN: handleFileSaved(jqEvent, doc)");

		console.assert(editor && editor.document === doc);
		refreshDiagram();

		_logger.log("END: handleFileSaved(jqEvent, doc)");
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
		CommandManager.get(_constants.Commands.command).setEnabled(true);
	}// enableMenuCommand()

	/**
	 * Disables the  'Preview' menu command for showing/hiding the preview panel.
	 */
	function disableMenuCommand() {
		if (CommandManager.get(_constants.Commands.command) !== undefined) {
			CommandManager.get(_constants.Commands.command).setEnabled(false);
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
		_logger.log("BEGIN: handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId)");

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

		_logger.log("END: handleCurrentEditorChange(jqEvent, newFile, newPaneId, oldFile, oldPaneId)");
	}// handleCurrentEditorChange()

	/**
	 * Registers and global event listeners
	 */
	function registerEventListeners() {
		_logger.log("BEGIN: registerEventListeners()");

		// listen for changes to the active editor
		MainViewManager.on("currentFileChange", handleCurrentEditorChange);

		// Close panel when close button is clicked.
		panel.$panel.on('click', '.close', hidePreviewPanel);
		// Refresh file when 'refresh' button clicked
		panel.$panel.on('click', '.refresh', refreshDiagram);

		_logger.log("END: registerEventListeners()");
	}// registerEventListeners()

	/**
	 * Initializes the preview panel
	 */
	function initPreviewPanel() {
		_logger.log("BEGIN: initPreviewPanel");

		panel = WorkspaceManager.createBottomPanel(_constants.Commands.preview, $(panelTemplate), 150);

		loadingImage = $("img.loading", panel.$panel);
		loadingImage.attr('src', loadingImageUrl);
		loadingImage.hide();

		_logger.log("END: initPreviewPanel");
	}// initPreviewPanel()


	/**
	 * Initializes the extension.
	 */
	AppInit.appReady(function () {
		_logger.log("Initializing...");

		registerLanguage();
		initPreviewPanel();
		registerEventListeners();
		_preferences.initPreferences();
		// Add preview menu item
		CommandManager.register("BracketsUML Preview Panel", _constants.Commands.command, handleShowHideCommand);
		Menus.getMenu(Menus.AppMenuBar.VIEW_MENU).addMenuItem(_constants.Commands.command);

		// FUTURE: Add toolbar icon to show/hide panel?

		_logger.log("Initialized");
	});
});
