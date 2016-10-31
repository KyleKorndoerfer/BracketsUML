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
		_logger.log("setDefaultPreferences() > '" + name + "' => " + existingPref);

		if (existingPref === null || existingPref === undefined) {
			_logger.log("setDefaultPreferences() > Adding default '" + name + "' preference");

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

		_logger.log("BEGIN: initPreferences()");

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

		_logger.log("END: initPreferences()");
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
