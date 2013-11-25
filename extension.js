/**
 * Better Volume Indicator
 *
 * This simple extension implements two things:
 * 	1. When scrolling on the volume indicator, the volume slider/menu appears to
 * 		display current level.
 * 	2. Middle/scroll clicking on the indicator, output is muted.
 *
 */
const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Mainloop = imports.mainloop;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const prettyPrint = Convenience.dbPrintObj;

const POPUP_TIMEOUT_SECS = 1;
let volumeIndicator, aggregateMenu;
let _onVolumeScrollEventId, _onVolumeIndicatorClickEventId;

let popupTimeout = null;
let availableMenus = [];
function _onVolumeScroll(indicators, e) {
	let menu = aggregateMenu.menu;
	let menuItems = menu._getMenuItems();

	// Only if menu is not already open
	if (!menu.actor.visible) {
		// We need to remove the previous timeout if the user scrolled again since
		// it means they are not ready yet for us to hide the menu
		_removeTimeout();

		// Set a timeout for the menu to close (we don't want it staying open forever)
		popupTimeout = Mainloop.timeout_add_seconds(POPUP_TIMEOUT_SECS, _onVolumeScrollTimeout);

		// We want to hide all menus which are not the volume menu
		_setMenusVisibility(false);

		// Open the aggregateMenu so we can see some volume
		aggregateMenu.menu.open();
	}
}

function _onVolumeScrollTimeout () {
	// Re-show menus
	_setMenusVisibility(true);

	// When time is up, we close the menu
	aggregateMenu.menu.close();

	popupTimeout = null;
}

function _onVolumeIndicatorClick (e) {
	// We want to see if the popup is already displayed, and if so, kill its
	// timeout, so it won't suddenly disappear on us
	// If it's not open, we don't won't to do anything
	if (popupTimeout !== null) {
		_removeTimeout();

		// Make sure menus are displayed
		_setMenusVisibility(true);

		// Make sure the menu is open
		// This is kinda hacky - since the aggregateMenu toggles its own
		// visibility, we want to reverse the effect. It's a dirty trick but I
		// could not figure out a better way to overcome its self-toggling
		aggregateMenu.menu.toggle();
	}
}

function _removeTimeout () {
	Mainloop.source_remove(popupTimeout);
	popupTimeout = null;
}

function _setMenusVisibility (visibility) {
	// Find the menus inside the aggregateMenu (I couldn't find a better
	// way for finding the menus except finding their indicators. seems to work
	// though)
	for (let k in aggregateMenu) {
		let entry = aggregateMenu[k];
		if (entry instanceof PanelMenu.SystemIndicator) {
			if (entry !== volumeIndicator){
				entry.menu.actor.visible = visibility;
			}
		}
	}
}

function init() {

}

function enable() {
	aggregateMenu = Main.panel.statusArea.aggregateMenu;

	if (aggregateMenu.hasOwnProperty('_volume') && aggregateMenu._volume instanceof PanelMenu.SystemIndicator) {
		volumeIndicator = aggregateMenu._volume;
		_onVolumeScrollEventId = volumeIndicator.indicators.connect('scroll-event', _onVolumeScroll);
		_onVolumeIndicatorClickEventId = aggregateMenu.actor.connect('button-press-event', _onVolumeIndicatorClick);
	}
}

function disable() {
	volumeIndicator.indicators.disconnect(_onVolumeScrollEventId);
	aggregateMenu.actor.disconnect(_onVolumeIndicatorClickEventId);
}
