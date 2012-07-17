/**
 * jQuery plugin to support inline text input autocomplete
 * 
 * Author         Russell Brown
 * Email          russ@RussBrownDevelopment.com
 * Website        http://www.RussBrownDevelopment.com
 * Project Site   https://code.google.com/p/jquery-rb-autocomplete
 * 
 * Notification of tweaks, improvements, additions and bugs is always appreciated.
 * 
 * http://www.gnu.org/licenses/gpl-3.0.txt
 * This project is licensed under GNU General Public License V3
 * 
 */

( function( $ ) {

	$.fn.rbdAutoComplete = function( options ) {

		// SETUP CONFIG DEFAULTS
		var defaults = {
			source : [],
			remoteSourceStatic : false,
			onSuggest : null,
			onSelect : null,
			queryArg : "term",
			valueColumn : "",
			displayColumn : "",
			suggestionRow : "",
			queryWait : 580,
			minChars : 3,
			maxSuggestions : 15
		};

		var plugin = this;
		var instanceId = $.guid++;

		console.log( "Initializing rbdAutoComplete Plugin: " + instanceId );

		plugin.cache = {};
		plugin.locked = false;
		plugin.caller = null;
		plugin.callerTask = null;
		plugin.settings = {};
		plugin.currentSelectedIndex = -1;
		plugin.settings = $.extend( {}, defaults, options, {
			instanceId : instanceId,
			wrapperId : "rb_autocomplete_wrapper" + instanceId,
			dropdownId : "rb_autocomplete_dropdown" + instanceId
		} );

		// Validate plugin settings and usage
		validateSettings( plugin );

		// Wrap the input box and add target for suggestions
		plugin.wrap( '<div id="' + plugin.settings.wrapperId + '" class="rb_autocomplete_wrapper" />' );
		plugin.after( '<div id="' + plugin.settings.dropdownId + '" class="rb_autocomplete_dropdown"></div>' );

		plugin.suggestionBox = $( '#' + plugin.settings.dropdownId );

		// Setup main event listeners
		plugin.keyup( plugin, onKeyPress );
		plugin.click( plugin, onClick );
		plugin.select( plugin, onSelected );
		plugin.blur( plugin, function( event ) {
			var plugin = event.data;
			plugin.chooseSuggestionByIndex( plugin.selectedIndex() );
			plugin.closeSuggestions();
		} );

		/**
		 * Trigger suggestions. Also called from CLICK, SELECT and KEYUP events
		 * 
		 * @param {string} input The text to be used for the suggestion
		 */
		plugin.suggest = function( input ) {
			plugin.addClass( "processing" );

			if ( typeof ( plugin.cache[ input ] ) == "object" ) {
				drawSuggestions( plugin, plugin.cache[ input ] );
			} else if ( plugin.settings.mode == "SimpleArray" ) {
				plugin.cache[ input ] = filterSimpleArray( plugin.settings.source, input );
				drawSuggestions( plugin, plugin.cache[ input ] );
			} else if ( plugin.settings.mode == "ComplexArray" ) {
				plugin.cache[ input ] = filterComplexArray( plugin.settings.source, input );
				drawSuggestions( plugin, plugin.cache[ input ] );
			} else {
				fetchSuggestionsFromURL( plugin, input );
			}
		};

		plugin.manuallySelectSuggestion = function( index ) {
			var suggestions = plugin.suggestionBox.find( "LI" );

			if ( typeof ( index ) != "number" || index >= suggestions.length ) {
				return -1;
			} else if ( plugin.currentSelectedIndex >= 0 ) {
				$( suggestions[ plugin.currentSelectedIndex ] ).removeClass( "hover" );
			}

			$( suggestions[ index ] ).addClass( "hover" );

			return plugin.selectedIndex( Math.max( index, -1 ) );
		};

		plugin.chooseSuggestionByIndex = function( index ) {
			if ( typeof ( index ) != "number" || index == -1 ) {
				return -1;
			}

			return chooseSuggestionByEl( plugin, $( plugin.suggestionBox.find( "LI" )[ index ] ) );
		};

		plugin.selectedIndex = function( index ) {

			if ( typeof ( index ) == "number" ) {
				plugin.currentSelectedIndex = index;
			}

			return plugin.currentSelectedIndex;
		};

		/**
		 * Closes suggestion box
		 */
		plugin.closeSuggestions = function() {
			plugin.currentSelectedIndex = -1;
			plugin.suggestionBox.empty();
		};

		return plugin;
	};

	var chooseSuggestionByEl = function( plugin, el ) {
		if ( plugin.settings.mode == "SimpleArray" ) {
			plugin.val( el.data().selectedValue );
		} else {
			plugin.val( el.data().selectedValue[ plugin.settings.valueColumn ] );
		}

		if ( typeof(plugin.settings.onSelect) == "function") {
			// Call user defined onSelect function
			plugin.settings.onSelect.call(plugin, el.data().selectedValue);
		}

		plugin.closeSuggestions();
	};

	/**
	 * @private Filter simple array of strings
	 * 
	 * @param {array} Suggestions to filter against. string[]
	 * @param {string} String to filter with
	 */
	var filterSimpleArray = function( aSuggestions, filter ) {
		var results = new Array();

		$.each( aSuggestions, function( index, value ) {
			if ( value.substr( 0, filter.length ).toLowerCase() == filter.toLowerCase() ) {
				results[ results.length ] = value;
			}
		} );

		return results;
	};

	/**
	 * @private Filter array of basic objects
	 * 
	 * @param {array} Suggestions to filter against. object[]
	 * @param {string} String to filter with
	 */
	var filterComplexArray = function( aSuggestions, filter ) {
		var results = new Array();

		$.each( aSuggestions, function( index, value ) {
			$.each( value, function( i, x ) {
				try {
					if ( x.substr( 0, filter.length ).toLowerCase() == filter ) {
						results.push( value );
					}
				} catch(e) {
					return
				}
			} );
		} );

		return $.unique( results );
	};

	/**
	 * @private Generate the display text for LI tags
	 * 
	 * @param {object} valueObj
	 */
	var genDisplayLabel = function( plugin, valueObj ) {
		var displayLabel = plugin.settings.suggestionRow;

		$.each( valueObj, function( index, value ) {
			displayLabel = displayLabel.replace( index, value );
		} );
		
		return displayLabel;
	};

	/**
	 * @private Fired when user types in input box
	 */
	var onKeyPress = function( event ) {
		var plugin = event.data;

		if (plugin.locked) {
			return -99;
		} else if ( event.keyCode == 27 ) { // Escape key
			plugin.closeSuggestions();
		} else if ( /[ A-Za-z0-9 ]/.test( String.fromCharCode( event.keyCode ) ) || ( /(8|46)/ ).test( event.keyCode ) ) {
			if ( event.currentTarget.value.length >= plugin.settings.minChars ) {
				plugin.suggest( event.currentTarget.value );
			} else {
				plugin.closeSuggestions();
			}
		} else if ( event.keyCode == 40 ) {
			if ( plugin.suggestionBox.html().length > 0 ) {
				plugin.manuallySelectSuggestion( ( plugin.selectedIndex() + 1 ) );
			} else if ( event.currentTarget.value.length >= plugin.settings.minChars ) {
				plugin.suggest( event.currentTarget.value );
			}
		} else if ( event.keyCode == 38 && plugin.suggestionBox.html().length > 0 ) {
			plugin.manuallySelectSuggestion( ( plugin.selectedIndex() - 1 ) );
		} else if ( event.keyCode == 13 && plugin.selectedIndex() > 0 ) {
			var el = $( plugin.suggestionBox.find( "LI" )[ plugin.selectedIndex() ] );
			chooseSuggestionByEl( plugin, el );
		}

		return -1;
	};

	/**
	 * @private Fired when user tabs into input
	 */
	var onSelected = function( event ) {
		var plugin = event.data;

		if (plugin.locked) {
			return -99;
		} else if ( event.currentTarget.value.length >= plugin.settings.minChars ) {
			plugin.suggest( event.currentTarget.value );
		}
	};

	/**
	 * @private
	 * 
	 * Fired when user clicks on input object
	 */
	var onClick = function( event ) {
		var plugin = event.data;

		if (plugin.locked) {
			return -99;
		} else if ( plugin.suggestionBox.html().length > 0 ) {
			plugin.closeSuggestions();
		} else if ( event.currentTarget.value.length > 0 ) { // If key pressed is CTRL, SHIFT or
			// ALT
			plugin.suggest( event.currentTarget.value );
		}

	};

	/**
	 * @private Fetch suggestions from remote source location
	 * 
	 * @param {$.fn.rbdAutoComplete} plugin The plugin/this scope for reference
	 * @param {string} input This is passed so that we may easily cache the value on the return side
	 */
	var fetchSuggestionsFromURL = function( plugin, input ) {
		if ( plugin.callerTask != null ) {
			clearTimeout( plugin.callerTask );
		}

		if ( plugin.caller != null && typeof ( plugin.caller.abort ) == "function" ) {
			plugin.caller.abort();
			plugin.caller = null;
		}

		if ( plugin.settings.source.indexOf( "?" ) > 0 ) {
			sourceUrl = plugin.settings.source + "&" + plugin.settings.queryArg + "=" + input;
		} else {
			sourceUrl = plugin.settings.source + "?" + plugin.settings.queryArg + "=" + input;
		}

		$( this ).attr( 'id', $.guid++ );

		plugin.callerTask = setTimeout( function() {
			getJSON( plugin, sourceUrl, input );
		}, plugin.settings.queryWait );
	};

	/**
	 * @private A wrapper for $.getJSON to make calling from a setTimeout event easier in other
	 *          parts of the script
	 * 
	 * @param {$.fn.rbdAutoComplete} plugin The plugin/this scope for reference
	 * @param {string} sourceUrl This is the fully compiled source URL that includes the lookup
	 *            value
	 * @param {string} input This is passed so that we may easily cache the value on the return side
	 */
	var getJSON = function( plugin, sourceUrl, input ) {
		plugin.caller = $.getJSON( sourceUrl, function( json ) {
			if ( plugin.settings.remoteSourceStatic == true ) {
				plugin.locked = true; // Stopping other things from running for a moment to process this.

				plugin.settings.source = json;
				validateSettings( plugin );
				plugin.suggest( input );
				
				plugin.locked = false;
			} else {
				plugin.cache[ input ] = json;
				drawSuggestions( plugin, json );
			}
		} );
	};

	/**
	 * @private Draw the suggestions to the page and setup hover and exiting events
	 * 
	 * @param {$.fn.rbdAutoComplete} plugin The plugin/this scope for reference
	 * @param {json} json A JSON Array of objects for building the suggestion box
	 */
	var drawSuggestions = function( plugin, aSuggestions ) {
		if ( !$.isArray( aSuggestions ) ) {
			alert( "Return results was not a properly formed array" );
			return -1;
		}

		aSuggestions = aSuggestions.slice( 0, Math.min( aSuggestions.length, ( plugin.settings.maxSuggestions - 1 ) ) );

		plugin.suggestionBox.html( "<ul></ul>" );

		if ( plugin.settings.mode == "SimpleArray" ) {
			$.each( aSuggestions, function( index, value ) {
				plugin.suggestionBox.find( "UL" ).append( "<li><span>" + value + "</span></li>" );
			} );
		} else if (plugin.settings.displayColumn.length > 0) {
			$.each( aSuggestions, function( index, value ) {
				plugin.suggestionBox.find( "UL" ).append( "<li><span>" + aSuggestions[ index ][plugin.settings.displayColumn] + "</span></li>" );
			} );
		} else {
			$.each( aSuggestions, function( index, value ) {
				plugin.suggestionBox.find( "UL" ).append( "<li><span>" + genDisplayLabel(plugin, aSuggestions[ index ]) + "</span></li>" );
			} );
		}

		plugin.suggestionBox.find( "LI" ).each( function( index ) {
			$( this ).data( {
				"selectedValue" : aSuggestions[ index ]
			} );
			$( this ).mouseover( {
				'plugin' : plugin,
				'index' : index
			}, function( event ) {
				var i = event.data.index;
				var plugin = event.data.plugin;

				plugin.selectedIndex( i );
				$( event.currentTarget ).addClass( "hover" );
			} );
			$( this ).mouseout( plugin, function( event ) {
				var plugin = event.data;

				plugin.selectedIndex( -1 );
				$( event.currentTarget ).removeClass( "hover" );
			} );

			$( this ).click( plugin, function( event ) {
				var plugin = event.data;
				chooseSuggestionByEl( plugin, $( event.currentTarget ) );
			} );
		} );

		plugin.suggestionBox.find( "LI" ).mouseover( plugin, function( event ) {
			var plugin = event.data;

			// Cancel Hiding of options
			clearTimeout( plugin.settings.closingTimer );

			$( "#" + plugin.settings.wrapperId ).mouseout( plugin, function( event ) {
				var plugin = event.data;

				// Start countdown to hide menu
				clearTimeout( plugin.settings.closingTimer );
				plugin.settings.closingTimer = setTimeout( function() {
					plugin.closeSuggestions();
				}, 250 );

			} );
		} );

		if ( typeof(plugin.settings.onSuggest) == "function") {
			// Call user defined onSuggest function
			plugin.settings.onSuggest.call(plugin, aSuggestions);
		}
		
		plugin.removeClass( "processing" );
	};

	/**
	 * @private Plugin validation
	 * 
	 * @param {$.fn.rbdAutoComplete} plugin The plugin/this scope for reference
	 */
	var validateSettings = function( plugin ) {
		var vMultiColumnSetup = function() {
			if ( plugin.settings.valueColumn.length == 0 ) {
				plugin.val( "Error" );
				alert( "You must provide a valueColumn configuration setting for simple object returns." );
				return;
			} else if ( plugin.settings.suggestionRow.length == 0 && plugin.settings.displayColumn.length == 0 ) {
				plugin.val( "Error" );
				alert( "You must provide a suggestionRow configuration setting for simple object returns." );
				return;
			}
		};

		if ( !plugin.is( "INPUT" ) ) {
			alert( "You may only initialize rbdAutoComplete on an input tag. " + plugin.is( "INPUT" ) );
			return -1;
		}

		if ( $.isArray( plugin.settings.source ) ) {
			if ( plugin.settings.source.length == 0 ) {
				alert( "The source array for autocomplete " + plugin.selector + " is empty" );
				return -1;
			} else if ( $.isPlainObject( plugin.settings.source[ 0 ] ) ) {
				plugin.settings.mode = "ComplexArray";
				vMultiColumnSetup();
			} else {
				plugin.settings.mode = "SimpleArray";
				return 1;
			}
		} else {
			plugin.settings.mode = "URL";

			vMultiColumnSetup();
		}

	};

}( jQuery ) );
