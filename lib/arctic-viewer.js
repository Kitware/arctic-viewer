/* global window document alert */
/* eslint-disable import/prefer-default-export */

// CSS loading ----------------------------------------------------------------

import 'font-awesome/css/font-awesome.css';
import 'normalize.css';
import 'babel-polyfill';

// Local import ---------------------------------------------------------------

import * as Factory from './factory';

// Dependencies injections ----------------------------------------------------

const iOS = /iPad|iPhone|iPod/.test(window.navigator.platform);

// Add class to body if iOS device --------------------------------------------

if (iOS) {
  document.querySelector('body').classList.add('is-ios-device');
}

// Expose viewer factory method -----------------------------------------------

export function load(url, container) {
  Factory.createViewer(url, (viewer) => {
    if (!viewer) {
      /* eslint-disable no-alert */
      alert('The metadata format seems to be unsupported.');
      /* eslint-enable no-alert */
      return;
    }

    Factory.createUI(viewer, container);
  });
}

export const updateConfig = Factory.updateConfig;
