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
   * Local data
   * ==========
   */
  
  /*
   * Flag indicating whether a scene is loaded.
   */
  var m_loaded = false;
  
  /*
   * The vertex buffer.
   * 
   * Only available if m_loaded.
   * 
   * This is a Float64Array with (n * 3) elements, where n is in the
   * range [1, 65535].  Each three elements is the (X, Y, Z) coordinate
   * of a vertex.  Vertex n starts at index (n * 3), where vertex zero
   * is the first vertex in the array.
   */
  var m_vtx;
  
  /*
   * Transformed vertex buffer.
   * 
   * Only available if m_loaded.
   * 
   * This is a Float64Array with the same number of elements as m_vtx.
   * At the start of a rendering operation, all vertices in m_vtx will
   * be transformed according to the current view matrix and the
   * transformed results will be stored in this array.  The
   * transformation does NOT include projection, however.
   */
  var m_tvx;
  
  /*
   * The scene object array.
   * 
   * Only available if m_loaded.
   * 
   * This is a Uint16Array with (n * 5) elements, where n is in the
   * range [1, 65535].  Each five elements define a 3D object in the
   * scene, as described below.  Object n starts at index (n * 5), where
   * object zero is the first object in the array.
   * 
   * The five 16-bit words have the following meaning:
   * 
   *   1 : vertex index of first vertex
   *   2 : vertex index of second vertex, or 0xffff if point
   *   3 : vertex index of third vertex, or 0xffff if point or line
   *   4 : fill color if triangle, else ignored
   *   5 : style (see below)
   * 
   * The object can be a point (one vertex), a line (two vertices), or a
   * triangle (three vertices).
   * 
   * The fill color for triangles is in 15-bit HiColor format with most
   * significant bit zero, as follows:
   * 
   *   MSB ----------- LSB
   *   0rrr rrgg gggb bbbb
   * 
   * For point objects, the style is an index into the point style
   * array.
   * 
   * For line objects, the style is an index into the line style array.
   * 
   * For triangle objects, the style encodes three five-bit selectors
   * and the most significant bit is zero, as follows:
   * 
   *   MSB ----------- LSB
   *   0iii iijj jjjk kkkk
   * 
   * Each selector is either zero, or it is one greater than the index
   * of style in the line style array.  This allows each selector to
   * select either one of the first 31 styles in the line style array,
   * or the special value of zero.
   * 
   * The first selector is for the triangle edge between the first and
   * second vertices.  The second selector is for the triangle edge
   * between the second and third vertices.  The third selector is for
   * the triangle edge between the third and first vertices.  If the
   * selector is zero, the edge will not be specially rendered.
   * Otherwise, the edge will be rendered using the selected line style.
   */
  var m_scene;
  
  /*
   * The painting sort array.
   * 
   * Only available if m_loaded.
   * 
   * This is a Uint32Array with (n / 5) elements, where n is the number
   * of elements in m_scene.  During a rendering operation, after vertex
   * transformation, scene objects that survive the backface cull and
   * full near/far plane clipping will be entered into this array.  Once
   * all the surviving objects are entered into this array, the array
   * will be sorted so that objects will be rendered back to front
   * according to the painter's algorithm.
   * 
   * Each 32-bit integer stores a Z value in its most significant 16
   * bits and an object index in its least significant 16 bits.  The
   * object index is an index into the m_scene array, or it has the
   * special value 0xffff, which means this array element is not used.
   * All array elements that are not used are given the value 0xffffffff
   * so that they are sorted at the end of the list.
   * 
   * The Z value is quantized so that zero is the far clipping plane and
   * 0xffff is the near clipping plane.  This means that when the array
   * is sorted in ascending numerical order, the farthest objects from
   * the camera come first.
   */
  var m_paint;
  
  /*
   * The point style array.
   * 
   * Only available if m_loaded.
   * 
   * This is a regular array, where each array element is an object.
   * These style objects are referenced from the style words of scene
   * objects of point type in m_scene.
   * 
   * All point style objects have the following properties:
   * 
   *   "shape"  : string  - the shape to render at the given point
   * 
   *   "size"   : float   - edge length of bounding box
   * 
   *   "stroke" : float   - stroke width
   * 
   * The following shapes are supported:
   * 
   *    Property value |            Shape
   *   ================+=============================
   *          c        | Circle
   *          s        | Square
   *          m        | Diamond
   *          u        | Triangle, pointing upwards
   *          d        | Triangle, pointing downwards
   *          l        | Triangle, pointing left
   *          r        | Triangle, pointing right
   *          p        | Plus sign +
   *          x        | X
   * 
   * The size must be greater than 0.0.  It defines how large the
   * rendered shape is.  This is the size when rendered in 2D,
   * regardless of the Z distance.
   * 
   * The stroke width must either be 0.0 or a value greater than 0.0.
   * If it is 0.0, the outline of the shape is not stroked.  Otherwise,
   * it is stroked with this width when rendered in 2D, regardless of
   * the Z distance.
   * 
   * All point styles for shapes that have an interior area (that is,
   * all shapes except plus sign "p" and X "x") also have the following
   * property:
   * 
   *   "fill" : integer - fill color or 0xffff for no fill
   * 
   * Fill color is encoded in 15-bit HiColor with most significant bit
   * zero, as follows:
   * 
   *   MSB ----------- LSB
   *   0rrr rrgg gggb bbbb
   * 
   * If the special 0xffff value is given, then the interior of the
   * shape is left transparent.
   * 
   * If the "stroke" property of the point style is greater than zero,
   * then the following property is also present:
   * 
   *   "ink" : integer - color to use for stroking the outline
   * 
   * The ink color is encoded in 15-bit HiColor with most significant
   * bit zero, as follows:
   * 
   *   MSB ----------- LSB
   *   0rrr rrgg gggb bbbb
   */
  var m_pstyle;
  
  /*
   * The line style array.
   * 
   * Only available if m_loaded.
   * 
   * This is a regular array, where each array element is an object.
   * These style objects are referenced from the style words of scene
   * objects of line or triangle type in m_scene.  Line objects may
   * reference any of the line styles, while triangle styles are only
   * able to reference the first 31 line styles.
   * 
   * All line style objects have the following properties:
   * 
   *   "width" : float   - width of the line
   * 
   *   "color" : integer - color of the line
   * 
   * The width must be greater than zero.  It is the 2D rendered width
   * of the line, regardless of the Z distance.
   * 
   * The color is encoded in 15-bit HiColor with most significant bit
   * zero, as follows:
   * 
   *   MSB ----------- LSB
   *   0rrr rrgg gggb bbbb
   */
  var m_lstyle;
  
  /*
   * The error message from the last failure of loadScene(), or false
   * if no error message stored.
   */
  var m_errmsg = false;
  
  /*
   * Local functions
   * ===============
   */
  
  /*
   * Report an error to console and throw an exception for a fault
   * occurring within this module.
   *
   * Parameters:
   *
   *   func_name : string - the name of the function in this module
   *
   *   loc : number(int) - the location within the function
   */
  function fault(func_name, loc) {
    
    // If parameters not valid, set to unknown:0
    if ((typeof func_name !== "string") || (typeof loc !== "number")) {
      func_name = "unknown";
      loc = 0;
    }
    loc = Math.floor(loc);
    if (!isFinite(loc)) {
      loc = 0;
    }
    
    // Report error to console
    console.log("Fault at " + func_name + ":" + String(loc) +
                  " in dla_main");
    
    // Throw exception
    throw ("dla_main:" + func_name + ":" + String(loc));
  }
  
  /*
   * Report a syntax error within a scene file and throw an exception.
   * 
   * The exception is always the string "dla_main:syntax_error".
   * 
   * If m_errmsg is false, then it will be set to reason if reason is a
   * string, otherwise to "Unknown error" if reason is not a string.  If
   * m_errmsg is not false, then it will not be changed by this
   * function.
   * 
   * Parameters:
   * 
   *   reason : string - the syntax error reason
   */
  function syntax(reason) {
    
    // If reason not a string, set to "Unknown error"
    if (typeof reason !== "string") {
      reason = "Unknown error";
    }
    
    // Store reason if no reason stored yet
    if (m_errmsg === false) {
      m_errmsg = reason;
    }
    
    // Throw syntax error
    throw ("dla_main:syntax_error");
  }
  
  /*
   * Public functions
   * ================
   */
  
  /*
   * Render the current scene using a 2D canvas rendering context.
   * 
   * Both width and height must be at least two.
   * 
   * Parameters:
   * 
   *   rc : CanvasRenderingContext2D - the 2D rendering context
   * 
   *   w : integer - the width in pixels of the canvas
   * 
   *   h : integer - the height in pixels of the canvas
   */
  function renderScene(rc, w, h) {
    // @@TODO:
    rc.fillStyle = "rgb(128, 128, 255)";
    rc.fillRect(0, 0, w, h);
  }
  
  /*
   * Retrieve error information about the last failed invocation of the
   * loadScene() function.
   * 
   * If the last invocation of loadScene() didn't fail, or it has never
   * been called, then this function returns the string "No error".
   * Otherwise, it returns an error message string.  The error message
   * string begins with a capital letter but has no punctuation or line
   * break at the end.
   * 
   * Return:
   * 
   *   string - the error message from the last failed loadScene()
   *   operation, or "No error"
   */
  function loadError() {
    
    if (m_errmsg === false) {
      return "No error";
    } else {
      return m_errmsg;
    }
  }
  
  /*
   * Load a scene from a given string.
   * 
   * If false is returned, the current scene is unmodified.  You can use
   * the loadError() function to get detail about what went wrong.
   * 
   * Parameters:
   * 
   *   str : string - the scene file contents to load
   * 
   * Return:
   * 
   *   true if successful, false if scene text has syntax error
   */
  function loadScene(str) {
    
    var func_name = "loadScene";
    var result;
    
    // Check parameter
    if (typeof str !== "string") {
      fault(func_name, 100);
    }
    
    // Begin by clearing the error message and setting result to true
    m_errmsg = false;
    result = true;
    
    // Wrap everything in an exception handler which in case of syntax
    // error sets the result to false and in case of any other kind of
    // exception rethrows the exception
    try {
      
      // @@TODO:
      
    } catch (ex) {
      // Check whether this was a syntax error
      if ((typeof ex === "string") &&
            (ex === "dla_main:syntax_error")) {
        // Syntax error, so just set result to false
        result = false;
      
      } else {
        // Other kinds of exceptions are rethrown
        throw(ex);
      }
    }
    
    // Return result
    return result;
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
    "renderScene": renderScene,
    "loadError": loadError,
    "loadScene": loadScene,
    "loadDefaultScene": loadDefaultScene
  };
  
}());
