/**
 * vis.js module imports, how to load depends on whether running in browser
 * or node.js.
 *
 * Try to load dependencies from the global window object. If not available
 * there, load via commonjs.
 */

// moment.js
exports.moment = (typeof window !== 'undefined') && window['moment'] || require('moment');

// emitter-component
exports.Emitter = require('emitter-component');

// hammer.js
if (typeof window !== 'undefined') {
  // load hammer.js only when running in a browser (where window is available)
  exports.Hammer = window['Hammer'] || require('hammerjs');
}
else {
  exports.Hammer = function () {
    throw Error('hammer.js is only available in a browser, not in node.js.');
  }
}

// mousetrap.js
if (typeof window !== 'undefined') {
  // load mousetrap.js only when running in a browser (where window is available)
  exports.mousetrap = window['mousetrap'] || require('mousetrap');
}
else {
  exports.mousetrap = function () {
    throw Error('mouseTrap is only available in a browser, not in node.js.');
  }
}
