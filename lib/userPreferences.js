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

/**
 * Module that encapsulates working with user preferences.
 */
define(function (require, exports, module) {
	"use strict";

	var		PrefsManager	= brackets.getModule("preferences/PreferencesManager"),
			_constants		= require("lib/constants"),
			_logger			= require("lib/logging"),
			_prefs			= PrefsManager.getExtensionPrefs("bracketsuml");

	/**
	 * Sets a default preference value if it doesn't already exist.
	 * @param {name} string The name of the preference.
	 * @param {type} string The type of the parameter (string, boolean, etc.)
	 * @param {value} any The default value for the preference.
	 * @param {options} object object that specifies the 'name' and 'description' for the preference.
	 */
	function setDefaultPreference(name, type, value, options)
	{
		var existingPref = _prefs.get(name);
		_logger.debug("setDefaultPreferences() > '" + name + "' => " + existingPref);

		if (existingPref === null || existingPref === undefined) {
			_logger.debug("setDefaultPreferences() > Adding default '" + name + "' preference");

			_prefs.definePreference(name, type, value, options);
			_prefs.set(name, value);
		}
	}

	/**
	 * Initializes the default preferences for the extension. This allows users
	 * to override these default values.
	 */
	function initPreferences() {
		var pref;

		_logger.group("initPreferences()");

		// PlantUML service URL
		setDefaultPreference(
				_constants.Preferences.serviceUrl,
				"string",
				_constants.DefaultPlantumlService,
				{ name: _constants.Preferences.serviceUrl, description: "Sets the URL for the PlantUML service to use" });

		// enable logging (default = false)
		setDefaultPreference(
				_constants.Preferences.loggingEnabled,
				"boolean",
				false,
				{
					name: _constants.Preferences.loggingEnabled,
					description: "Enables/disables logging for the extension",
					values: [true, false]
				});

		_logger.endGroup();
	}

	/* Global Preferences
	 *************************************************************************/

	/**
	 * Gets the global proxy setting value.
	 */
	function getProxy() {
		return PrefsManager.get("proxy");
	}

	/* User Preferences
	 *************************************************************************/

	/**
	 * Gets the ServiceURL extension preference.
	 */
	function getServiceUrl() {
		return _prefs.get(_constants.Preferences.serviceUrl);
	}

	/**
	 * Gets the LoggingEnabled extension preference.
	 */
	function getLoggingEnabled() {
		return _prefs.get(_constants.Preferences.loggingEnabled);
	}


	// module exports
	exports.initPreferences = initPreferences;
	exports.proxy = getProxy;
	exports.serviceUrl = getServiceUrl;
	exports.loggingEnabled = getLoggingEnabled;
});
