// CSS loading -----------------------------------------------------------------

require('font-awesome/css/font-awesome.css');
require('normalize.css');
require('tonic-widgets/lib/css/state.css');

// Dependencies injections -----------------------------------------------------

var Factory = require('./factory.js');

// Expose viewer factory method ------------------------------------------------

export function load(url, container) {
    Factory.createViewer(url, function(viewer) {
        if(!viewer) {
            return alert("The metadata format seems to be unsupported.");
        }

        Factory.createUI(viewer, container);
    });
}
