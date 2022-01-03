"use strict";

/*
 * dla.js
 * ======
 * 
 * Main program module for Delilah Viewer.
 */

// Wrap everything in an anonymous function that we immediately invoke
// after it is declared -- this prevents anything from being implicitly
// added to global scope
(function() {
  
  /*
   * Public functions
   * ================
   */
  
  /*
   * Load a scene from a given string.
   * 
   * Parameters:
   * 
   *   str : string - the scene file contents to load
   */
  function loadScene(str) {
    // @@TODO:
    console.log("loadScene");
  }
  
  /*
   * Load the default scene that is used when no scene file is loaded.
   */
  function loadDefaultScene() {
    // @@TODO:
    console.log("loadDefaultScene");
  }
  
  /*
   * Export declarations
   * ===================
   * 
   * All exports are declared within a global "dla_main" object.
   */
  window.dla_main = {
    "loadScene": loadScene,
    "loadDefaultScene": loadDefaultScene
  };
  
}());
