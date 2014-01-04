============================
Better Volume Indicator
============================

This simple extension implements two small features:

#. When using the mouse-scroll over the volume indicator, the volume slider appears and displays the appropriate level.
#. Clicking on the volume indicator using the mouse middle button will toggle output mute.

Extension page on e.g.o:
https://extensions.gnome.org/extension/759/better-volume-indicator/

Installation
----------------

Installtaion via git is performed by cloning the repo into your local gnome-shell extensions directory (usually ~/.local/share/gnome-shell/extensions/)::

    $ git clone https://github.com/Tudmotu/gnome-shell-extension-bettervolume.git <extensions-dir>/bettervolume@tudmotu.com

After cloning the repo, the extension is practically installed yet disabled. In
order to enable it, you need to use gnome-tweak-tools - find the extension,
titled 'Better Volume Indicator', in the 'Extensions' screen and turn it 'On'.
You may need to restart the shell (Alt+F2 and insert 'r' in the prompt) for the
extension to be listed there.
