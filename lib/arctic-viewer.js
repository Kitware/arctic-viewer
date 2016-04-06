import * as Factory from './factory.js';

// CSS loading ----------------------------------------------------------------

import 'font-awesome/css/font-awesome.css';
import 'normalize.css';

// Dependencies injections ----------------------------------------------------

const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

// Add class to body if iOS device --------------------------------------------

if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

// Expose viewer factory method -----------------------------------------------

export function load(url, container) {
  Factory.createViewer(url, viewer => {
    if (!viewer) {
      /* eslint-disable no-alert */
      alert('The metadata format seems to be unsupported.');
      /* eslint-enable no-alert */
      return;
    }

    Factory.createUI(viewer, container);
  });
}
