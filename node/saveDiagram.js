/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global require, exports */

/**
 * Simple module that fetches the diagram from the PlantUML services and saves
 * it to disk beside the diagram text file.
 */
(function () {
	"use strict";

	var http		= require("http"),
		fs			= require("fs"),
		URL			= require('url');

	/**
	 * @private
	 * Handler function for the saveDiagram command.
	 * @param {string} url The encoded url for the diagram on the server.
	 * @param {string} filename The full path to save the file to.
	 * @param {string} proxy The proxy server to use (optional)
	 */
	function cmdSaveDiagram(url, filename, proxy) {
		var fStream = fs.createWriteStream(filename),
			options;

		if (proxy === null) {
			options = url;
		} else {
			var parsedUrl = URL.parse(proxy);
			options = {host: parsedUrl.hostname, port: parsedUrl.port, path: url};
		}

		http.get(options, function (response) {
			response.pipe(fStream);
		}).on('error', function (err) {
			console.log("Got error: " + err.message);
		});
	}

	/**
	 * Initializes the Brackets domain with the saveDiagram command.
	 * @param {DomainManager} domainManager The domain manager for the server.
	 */
	function init(domainManager) {
		if (!domainManager.hasDomain("saveDiagram")) {
			domainManager.registerDomain("saveDiagram", {major: 0, minor: 1});
		}

		domainManager.registerCommand(
			"saveDiagram",		// domain name
			"save",				// command name
			cmdSaveDiagram,		// command helper function
			false,				// this command is synchronous in Node
			"Fetches the rendered diagram from the server and saves it to disk",
			// paramters
			[{name: "url", type: "string", description: "The URL of the image to fetch" },
				{name: "filename", type: "string", description: "The full path to where to save the file"},
				{name: "proxy", type: "string", description: "The proxy server to use (if needed; optional)"}],
			null
		);
	}

	exports.init = init;
}());
