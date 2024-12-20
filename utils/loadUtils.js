const fs = require('fs');
const path = require('path');

const utils = {};
const utilsPath = path.join(__dirname);

/**
 * Loads utility modules from the 'utils' directory, excluding 'loadUtils.js'.
 * 
 * This function dynamically loads all JavaScript files in the 'utils' directory, excluding itself ('loadUtils.js').
 * Each module is loaded and added to the `utils` object. If the module exports a single key-value pair, 
 * it will extract the value directly for convenience.
 * 
 * @module loadUtils
 */
fs.readdirSync(utilsPath)
  .filter(file => file.endsWith('.js') && file !== 'loadUtils.js') // Exclude itself
  .forEach(file => {
    const utilName = path.basename(file, '.js'); // Extract the file name to use as key
    const utilModule = require(path.join(utilsPath, file)); // Load the module

    // If the module exports an object with a single key, extract its value
    utils[utilName] = utilModule && typeof utilModule === 'object' && Object.keys(utilModule).length === 1
      ? utilModule[Object.keys(utilModule)[0]]
      : utilModule;

    // Log the loaded utility module name
    // console.log(`[Bootstrap/Utils] Loaded utility: ${utilName}`);
  });

/**
 * Returns the utilities either all or selected based on destructuring requirements.
 * 
 * If the parent module requires specific utilities through destructuring, only those utilities will be returned.
 * If no destructuring is detected, all the available utilities will be returned.
 * 
 * @returns {Object} Selected utilities or all utilities depending on the destructuring.
 */
module.exports = (function() {
  // Check if the parent module requires specific destructured utilities
  if (Object.keys(module.parent.exports).length) {
    const keys = Object.keys(module.parent.exports);
    const selectedUtils = {};

    keys.forEach(key => {
      if (utils[key]) {
        selectedUtils[key] = utils[key];
        // Only log the utilities that are destructured
        // console.log(`[Bootstrap/Utils] Loaded utility: ${key}`);
      }
    });

    return selectedUtils;
  }

  // If no destructuring, return all utilities
  return utils;
})();