/**
 * Better Volume Indicator
 *
 * This simple extension implements two things:
 *     1. When scrolling on the volume indicator, the volume slider/menu appears to
 *         display current level.
 *     2. Middle/scroll clicking on the indicator, output is muted.
 *
 */
const Clutter = imports.gi.Clutter;
const Mainloop = imports.mainloop;

const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const VolumeMenu = imports.ui.status.volume.VolumeMenu;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Convenience = Me.imports.convenience;
const prettyPrint = Convenience.dbPrintObj;

const POPUP_TIMEOUT_SECS = 1;
const VOLUME_MUTE_ICON = 'audio-volume-muted-symbolic';
let onlyVolumeMenuShown = false;
let volumeIndicator;
let aggregateMenu;
let _onAggregateMenuClickEventId;
let _onAggregateMenuEnterEventId;
let _onAggregateMenuLeaveEventId;
let _onVolumeIndicatorScrollEventId;
let _onVolumeIndicatorClickEventId;

let popupTimeout = null;
let availableMenus = [];
function _onVolumeIndicatorScroll(indicators, e) {
    let menu = aggregateMenu.menu;

    // Only if menu is not already open (and not due to our request)
    if (menu.actor.visible && popupTimeout === null)
        return;

    // We need to remove the previous timeout if the user scrolled again since
    // it means they are not ready yet for us to hide the menu
    if (popupTimeout !== null) _removeTimeout();

    // Set a timeout for the menu to close (we don't want it staying open forever)
    _setTimeout();

    // We want to hide all menus which are not the volume menu
    _setMenusVisibility(false);

    // Open the aggregateMenu so we can see some volume
    aggregateMenu.menu.open();
}

function _onVolumeIndicatorScrollTimeout () {
    // When time is up, we close the menu
    aggregateMenu.menu.close();

    // Re-show the aggegate menu entries
    _setMenusVisibility(true);

    _removeTimeout();
}

function _onAggregateMenuClick (actor, e) {
    // Make sure menus are displayed
    _setMenusVisibility(true);

    // We want to see if the popup is already displayed, and if so, kill its
    // timeout, so it won't suddenly disappear on us
    // If it's not open, we don't won't to do anything
    if (popupTimeout !== null) {
        _removeTimeout();

        // Make sure the menu is open
        // This is kinda hacky - since the aggregateMenu toggles its own
        // visibility, we want to reverse the effect. It's a dirty trick but I
        // could not figure out a better way to overcome its self-toggling
        aggregateMenu.menu.toggle();
    }
}

function _onAggregateMenuEnter () {
    _removeTimeout();
}

function _onAggregateMenuLeave () {
    // When mouse leaves, set a new timeout only if menu was shown due to
    // volume-scrolling (meaning - this extension caused the menu to appear, and
    // not, say, a click on the aggregate-menu by the user)
    if (onlyVolumeMenuShown) _setTimeout();
}

let _previousVolumeValue, _previousVolumeIcon;
function _onVolumeIndicatorClick (actor, e) {
    // When middle-clicking on the indicator we want to toggle mute
    if (e.get_button() === Clutter.BUTTON_MIDDLE) {
        let sliderActor = volumeIndicator._volumeMenu._output._slider; // hummm.. hack?
        let currentValue = sliderActor._getCurrentValue(); // starting to look like a hack
        let currentIcon = volumeIndicator._primaryIndicator.icon_name;

        if (currentValue === 0 && _previousVolumeValue) {
            // this is definitely a hack
            sliderActor.setValue(_previousVolumeValue);
            sliderActor.emit('value-changed', _previousVolumeValue); // mimic slider behvaiour so volume will actually change
            volumeIndicator._primaryIndicator.icon_name = _previousVolumeIcon;
        }
        else {
            // a dirty dirty hack
            sliderActor.setValue(0);
            sliderActor.emit('value-changed', 0); // like above
            volumeIndicator._primaryIndicator.icon_name = VOLUME_MUTE_ICON;
            _previousVolumeValue = currentValue;
            _previousVolumeIcon = currentIcon;
        }

        aggregateMenu.menu.toggle(); // again with that previous hack
    }
}

function _setTimeout () {
    popupTimeout = Mainloop.timeout_add_seconds(POPUP_TIMEOUT_SECS, _onVolumeIndicatorScrollTimeout);
}

function _removeTimeout () {
    if (popupTimeout !== null)
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
            if (entry !== volumeIndicator) {
                entry.menu.actor.visible = visibility;
            }
        }
    }

    // Hide inner menus inside the volume section
    volumeIndicator.menu._getMenuItems().forEach(function (item, i) {
        if ( !(item instanceof VolumeMenu) ) {
            item.actor.visible = visibility;
        }
    });

    // Mark volume menu visibility accordingly
    onlyVolumeMenuShown = !visibility;
}

function init() {

}

function enable() {
    aggregateMenu = Main.panel.statusArea.aggregateMenu;

    if (aggregateMenu.hasOwnProperty('_volume') && aggregateMenu._volume instanceof PanelMenu.SystemIndicator) {
        volumeIndicator = aggregateMenu._volume;
        _onVolumeIndicatorScrollEventId = volumeIndicator.indicators.connect('scroll-event', _onVolumeIndicatorScroll);
        _onVolumeIndicatorClickEventId = volumeIndicator.indicators.connect('button-press-event', _onVolumeIndicatorClick);
        _onAggregateMenuEnterEventId = aggregateMenu.menu.actor.connect('enter-event', _onAggregateMenuEnter);
        _onAggregateMenuLeaveEventId = aggregateMenu.menu.actor.connect('leave-event', _onAggregateMenuLeave);
        _onAggregateMenuClickEventId = aggregateMenu.actor.connect('button-press-event', _onAggregateMenuClick);
    }
}

function disable() {
    // We need to verify we still have connections and disconnect them
    if (_onVolumeIndicatorScrollEventId)
        volumeIndicator.indicators.disconnect(_onVolumeIndicatorScrollEventId);

    if (_onVolumeIndicatorClickEventId)
        volumeIndicator.indicators.disconnect(_onVolumeIndicatorClickEventId);

    if (_onAggregateMenuEnterEventId)
        aggregateMenu.menu.actor.disconnect(_onAggregateMenuEnterEventId);

    if (_onAggregateMenuLeaveEventId)
        aggregateMenu.menu.actor.disconnect(_onAggregateMenuLeaveEventId);

    if (_onAggregateMenuClickEventId)
        aggregateMenu.actor.disconnect(_onAggregateMenuClickEventId);
}

