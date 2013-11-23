const Gdk = imports.gi.Gdk;
const GLib = imports.gi.GLib;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const Gio = imports.gi.Gio;
const Mainloop = imports.mainloop;

const Main = imports.ui.main;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const dbPrintObj = Convenience.dbPrintObj;

const POPUP_TIMEOUT_SECS = 1;
let volumeIndicator, aggregateMenu;
let popupTimeout = null;

function _onVolumeScroll(indicators, e) {
	let menu = aggregateMenu.menu;
	let menuItems = menu._getMenuItems();
	
	if (popupTimeout !== null) {
		Mainloop.source_remove(popupTimeout);
	}
	popupTimeout = Mainloop.timeout_add_seconds(POPUP_TIMEOUT_SECS, function () {
		aggregateMenu.menu.close();
	});

	aggregateMenu.menu.open();
}

function init() {

}

function enable() {
	aggregateMenu = Main.panel.statusArea.aggregateMenu;

	if (aggregateMenu.hasOwnProperty('_volume')) {
		volumeIndicator = aggregateMenu._volume;
		volumeIndicator.indicators.connect('scroll-event', _onVolumeScroll);
	}
}

function disable() {

}
