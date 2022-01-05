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
   * Constants
   * =========
   */
  
  /*
   * String containing each of the allowed shape codes for point styles.
   */
  var VALID_SHAPES = "csmudlrpx";
  
  /*
   * String containing each of the shape codes that permit a fill
   * property.
   */
  var FILL_SHAPES = "csmudlr";
  
  /*
   * Local data
   * ==========
   */
  
  /*
   * The 3D position of the camera.
   * 
   * The first three numbers are the (X, Y, Z) coordinate of the camera
   * in worldspace.
   * 
   * The fourth number is the yaw angle about the Y axis.  An angle of
   * zero means that the camera is looking towards negative infinity on
   * the Z axis (right-handed).  When looking down at the camera along
   * the Y axis from above it, increasing yaw angles rotate the camera
   * counter-clockwise.  The range of the yaw angle is normalized, such
   * that 0.0 is zero degrees/radians and 1.0 is 360 degrees or 2*PI
   * radians.  The valid range of the fourth number is zero up to but
   * excluding 1.0.
   * 
   * The fifth number is the pitch about the X axis.  An angle of zero
   * means that the camera is level with the XZ plane.  Positive angles
   * tilt the camera upwards, while negative angles tilt the camera
   * downwards.  The range of the tilt angle is normalized such that 1.0
   * is 90 degrees or PI/2 radians, looking straight up, and -1.0 is -90
   * degrees or -PI/2 radians, looking straight down.
   * 
   * The sixth number is the roll about the Z axis.  An angle of zero
   * means that the camera is level with the XZ plane.  Increasing
   * angles tilt the camera counter-clockwise.  The range of the roll
   * angle is normalized, such that 0.0 is zero degrees/radians and 1.0
   * is 360 degrees or 2*PI radians.  The valid range of the sixth
   * number is zero up to but excluding 1.0.
   */
  var m_cam = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0];
  
  /*
   * The error message from the last failure of loadScene(), or false
   * if no error message stored.
   */
  var m_errmsg = false;
  
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
   * The radius buffer.
   * 
   * Only available if m_loaded.
   * 
   * This is a Float64Array with up to 65535 elements.  It may be empty.
   * Each element must be a finite value that is greater than zero.
   * Sphere objects reference elements in this array to declare their
   * radius.
   */
  var m_rad;
  
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
   *   2 : vertex index of second vertex, or 0xffff if point or sphere
   *   3 : index of third vertex or radius, or 0xffff if point or line
   *   4 : fill color if triangle or sphere, else ignored
   *   5 : style (see below)
   * 
   * The object can be a point (one vertex), a line (two vertices), a
   * sphere (one vertex and one radius) or a triangle (three vertices).
   * All indices that are not 0xffff are indices into the vertex buffer,
   * except the radius index for spheres is an index into the radius
   * buffer.
   * 
   * The fill color for triangles is in 15-bit HiColor format with most
   * significant bit zero, as follows:
   * 
   *   MSB ----------- LSB
   *   0rrr rrgg gggb bbbb
   * 
   * The fill color for spheres has the same format, except 0xffff is
   * allowed as a special value indicating the sphere is transparent and
   * has no fill.
   * 
   * For point objects, the style is an index into the point style
   * array.
   * 
   * For line objects, the style is an index into the line style array.
   * 
   * For sphere objects, the style is an index into the line style array
   * indicating how to stroke the circular outline of the sphere, or
   * 0xffff indicating that the circular outline should not be stroked.
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
   * of elements in m_scene (in other words, the length of this array
   * equals the total number of scene objects).  During a rendering
   * operation, after vertex transformation, scene objects that survive
   * the backface cull and full near/far plane clipping will be entered
   * into this array.  Once all the surviving objects are entered into
   * this array, the array will be sorted so that objects will be
   * rendered back to front according to the painter's algorithm.
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
   * objects of point type in m_scene.  There may be at most 65535 point
   * styles, and the array may also be empty.
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
   * regardless of the Z distance.  If you want a 3D sphere, don't use
   * the circle point shape, because its size doesn't change according
   * to distance; instead, use a sphere object in the scene.
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
   * objects of line, sphere, or triangle type in m_scene.  Line and
   * sphere objects may reference any of the line styles, while triangle
   * styles are only able to reference the first 31 line styles.  There
   * may be at most 65535 line styles, and the line style array may also
   * be empty.
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
   * Get the current camera position.
   * 
   * This returns an array of six values [x, y, z, yaw, pitch, roll]
   * where (X, Y, Z) are the camera position in worldspace, yaw and roll
   * are normalized angles in range [0.0, 1.0), and pitch is a
   * normalized angle in range [-1.0, 1.0].  See the documentation of
   * m_cam for further information.
   * 
   * Return:
   * 
   *   a new array copy of the current camera position
   */
  function getCamera() {
    
    var result = [];
    
    result.push(m_cam[0]);
    result.push(m_cam[1]);
    result.push(m_cam[2]);
    result.push(m_cam[3]);
    result.push(m_cam[4]);
    result.push(m_cam[5]);
    
    return result;
  }
  
  /*
   * Set the camera position.
   * 
   * (X, Y, Z) are the coordinates of the camera in worldspace.  The
   * coordinates can be any finite values.
   * 
   * yaw and roll are normalized angles in range [0.0, 1.0) (not
   * including 1.0), while pitch is a normalized angle in the range
   * [-1.0, 1.0].  See the documentation of m_cam for further
   * information.
   * 
   * Parameters:
   * 
   *   x : number - the X coordinate
   * 
   *   y : number - the Y coordinate
   * 
   *   z : number - the Z coordinate
   * 
   *   yaw : number - the normalized yaw angle
   * 
   *   pitch : number - the normalized pitch angle
   * 
   *   roll : number - the normalized roll angle
   */
  function setCamera(x, y, z, yaw, pitch, roll) {
    
    var func_name = "setCamera";
    
    // Check parameters
    if ((typeof x !== "number") ||
        (typeof y !== "number") ||
        (typeof z !== "number") ||
        (typeof yaw !== "number") ||
        (typeof pitch !== "number") ||
        (typeof roll !== "number")) {
      fault(func_name, 100);
    }
    
    if ((!isFinite(x)) ||
        (!isFinite(y)) ||
        (!isFinite(z)) ||
        (!isFinite(yaw)) ||
        (!isFinite(pitch)) ||
        (!isFinite(roll))) {
      fault(func_name, 110);
    }
    
    if ((!((yaw >= 0.0) && (yaw < 1.0))) ||
        (!((pitch >= -1.0) && (pitch <= 1.0))) ||
        (!((roll >= 0.0) && (roll < 1.0)))) {
      fault(func_name, 120);
    }
    
    // Update camera position
    m_cam[0] = x;
    m_cam[1] = y;
    m_cam[2] = z;
    m_cam[3] = yaw;
    m_cam[4] = pitch;
    m_cam[5] = roll;
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
    var data;
    var i, a, b, c, x, y, o;
    var ii, ij, ik;
    
    var pscount;
    var lscount;
    var rcount;
    var vcount;
    var scount;
    
    var vtx;
    var scene;
    var rbuf;
    var ps;
    var ls;
    
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
      
      // Parse the string as JSON
      try {
        data = JSON.parse(str);
      } catch (ex) {
        syntax("Not a valid JSON file");
      }
      if (data == null) {
        syntax("Not a valid JSON file");
      }
      
      // Top-level JSON entity must be object
      if ((typeof data !== "object") || (data instanceof Array)) {
        syntax("Top-level entity must be object");
      }
      
      // If the point styles member exists, it must be an array; store
      // its length as the point styles count, else set point styles
      // count to zero
      if ("pstyle" in data) {
        if ((typeof data.pstyle !== "object") ||
              (!(data.pstyle instanceof Array))) {
          syntax("pstyle property must be array");
        }
        pscount = data.pstyle.length;
        
      } else {
        pscount = 0;
      }
      
      // If the line styles member exists, it must be an array; store
      // its length as the line styles count, else set line styles count
      // to zero
      if ("lstyle" in data) {
        if ((typeof data.lstyle !== "object") ||
              (!(data.lstyle instanceof Array))) {
          syntax("lstyle property must be array");
        }
        lscount = data.lstyle.length;
        
      } else {
        lscount = 0;
      }
      
      // If the radius member exists, it must be an array; store its
      // length as the radius count, else set radius count to zero
      if ("radius" in data) {
        if ((typeof data.radius !== "object") ||
              (!(data.radius instanceof Array))) {
          syntax("radius property must be array");
        }
        rcount = data.radius.length;
        
      } else {
        rcount = 0;
      }
      
      // The vertex member must exist and be an array and have a number
      // of elements that is greater than zero and divisible by three;
      // set the vertex count
      if (!("vertex" in data)) {
        syntax("Missing vertex property");
      }
      if ((typeof data.vertex !== "object") ||
            (!(data.vertex instanceof Array))) {
        syntax("vertex property must be array");
      }
      if (data.vertex.length < 1) {
        syntax("Vertex buffer may not be empty");
      }
      if ((data.vertex.length % 3) !== 0) {
        syntax("Vertex buffer array must be a multiple of 3");
      }
      vcount = data.vertex.length / 3;
      
      // The scene member must exist and be an array and have a number
      // of elements that is greater than zero and divisible by five;
      // set the scene count
      if (!("scene" in data)) {
        syntax("Missing scene property");
      }
      if ((typeof data.scene !== "object") ||
            (!(data.scene instanceof Array))) {
        syntax("scene property must be array");
      }
      if (data.scene.length < 1) {
        syntax("Scene graph may not be empty");
      }
      if ((data.scene.length % 5) !== 0) {
        syntax("Scene graph array be a multiple of 5");
      }
      scount = data.scene.length / 5;
      
      // Check that all the array counts are in valid ranges
      if (pscount > 65535) {
        syntax("At most 65535 point styles are allowed");
      }
      if (lscount > 65535) {
        syntax("At most 65535 line styles are allowed");
      }
      if (rcount > 65535) {
        syntax("At most 65535 radius definitions are allowed");
      }
      if (vcount > 65535) {
        syntax("At most 65535 vertex definitions are allowed");
      }
      if (scount > 65535) {
        syntax("At most 65535 scene objects are allowed");
      }
      
      // Create a new typed vertex array buffer and copy in all the
      // vertices, checking along the way that everything is a finite
      // number
      vtx = new Float64Array(vcount * 3);
      for(i = 0; i < vcount; i++) {
        // Get each of the vertex elements
        a = data.vertex[i * 3];
        b = data.vertex[(i * 3) + 1];
        c = data.vertex[(i * 3) + 2];
        
        // Check that everything is a number
        if ((typeof a !== "number") ||
            (typeof b !== "number") ||
            (typeof c !== "number")) {
          syntax("Vertex buffer may only contain numbers");
        }
        
        // Check that everything is finite
        if ((!isFinite(a)) ||
            (!isFinite(b)) ||
            (!isFinite(c))) {
          syntax("Vertex buffer may only contain finite values");
        }
        
        // Store in the vertex buffer
        vtx[ i * 3     ] = a;
        vtx[(i * 3) + 1] = b;
        vtx[(i * 3) + 2] = c;
      }
      
      // Create a new typed scene object buffer and copy in all the
      // scene objects, checking their formats and references along the
      // way
      scene = new Uint16Array(scount * 5);
      for(i = 0; i < scount; i++) {
        // Get each of the scene object elements
        a = data.scene[i * 5];
        b = data.scene[(i * 5) + 1];
        c = data.scene[(i * 5) + 2];
        x = data.scene[(i * 5) + 3];
        y = data.scene[(i * 5) + 4];
        
        // Everything must be a number
        if ((typeof a !== "number") ||
            (typeof b !== "number") ||
            (typeof c !== "number") ||
            (typeof x !== "number") ||
            (typeof y !== "number")) {
          syntax("Scene buffer may only contain numbers");
        }
        
        // Floor everything to integer value
        a = Math.floor(a);
        b = Math.floor(b);
        c = Math.floor(c);
        x = Math.floor(x);
        y = Math.floor(y);
        
        // Integer values must all be finite
        if ((!isFinite(a)) ||
            (!isFinite(b)) ||
            (!isFinite(c)) ||
            (!isFinite(x)) ||
            (!isFinite(y))) {
          syntax("Scene buffer may only contain finite integers");
        }
        
        // Integer values must all be in unsigned 16-bit range
        if ((a < 0) || (a > 65535) ||
            (b < 0) || (b > 65535) ||
            (c < 0) || (c > 65535) ||
            (x < 0) || (x > 65535) ||
            (y < 0) || (y > 65535)) {
          syntax("Scene buffer may only contain 16-bit integers");
        }
        
        // First element must always be a valid vertex index
        if (a >= vcount) {
          syntax("First vertex must always be valid index");
        }
        
        // Rest of checking depends on object type
        if ((b !== 65535) && (c !== 65535)) {
          // All three vertices defined, so TRIANGLE -- begin by
          // checking vertex ranges
          if ((b >= vcount) || (c >= vcount)) {
            syntax("Triangles must have three valid vertices");
          }
          
          // Check that fill color is in HiColor range
          if (x >= 0x8000) {
            syntax("Triangles must have 15-bit fill color");
          }
          
          // Check that style word is in 15-bit range
          if (y >= 0x8000) {
            syntax("Triangles must have 15-bit style");
          }
          
          // Get the edge selector values
          ii = (y >> 10);
          ij = (y >> 5) & 0x1f;
          ik = y & 0x1f;
          
          // For edge selectors that are greater than zero, make sure
          // that one less than their value is a valid line style
          if (ii > 0) {
            if (ii > lscount) {
              syntax("Selectors must reference line style or none");
            }
          }
          if (ij > 0) {
            if (ij > lscount) {
              syntax("Selectors must reference line style or none");
            }
          }
          if (ik > 0) {
            if (ik > lscount) {
              syntax("Selectors must reference line style or none");
            }
          }
          
        } else if ((b === 65535) && (c !== 65535)) {
          // First and last vertices defined, so SPHERE -- begin by
          // checking radius range
          if (c >= rcount) {
            syntax("Spheres must have valid radius indices");
          }
          
          // Check that fill color is in HiColor range or is the special
          // 0xffff value indicating no fill
          if ((x >= 0x8000) && (x !== 0xffff)) {
            syntax("Spheres must have 15-bit fill or be transparent");
          }
          
          // Fifth element must be index into line styles or special
          // 0xffff value indicating no edge line
          if ((y >= lscount) && (y !== 0xffff)) {
            syntax("Spheres must reference line style or transparent");
          }
          
          // Spheres may not have both transparent fill and transparent
          // stroke
          if ((x === 0xffff) && (y === 0xffff)) {
            syntax("Spheres may not be fully transparent");
          }
          
        } else if ((b !== 65535) && (c === 65535)) {
          // First and second vertices defined, so LINE -- begin by
          // checking vertex range
          if (b >= vcount) {
            syntax("Lines must have two valid vertices");
          }
          
          // Set fourth element to zero since it is not used
          x = 0;
          
          // Check that fifth element is index into line styles
          if (y >= lscount) {
            syntax("Lines must reference defined line style");
          }
          
        } else if ((b === 65535) && (c === 65535)) {
          // Only first vertex defined, so POINT -- begin by setting
          // fourth element to zero since it is not used
          x = 0;
          
          // Check that fifth element is index into point styles
          if (y >= pscount) {
            syntax("Points must reference defined point style");
          }
          
        } else {
          // Shouldn't happen
          fault(func_name, 200);
        }
        
        // Store in the scene buffer
        scene[ i * 5     ] = a;
        scene[(i * 5) + 1] = b;
        scene[(i * 5) + 2] = c;
        scene[(i * 5) + 3] = x;
        scene[(i * 5) + 4] = y;
      }
      
      // If there is at least one radius definition, define the radius
      // table, checking that all radii are numbers that are finite and
      // greater than zero; otherwise, set the radius table to null
      rbuf = null;
      if (rcount > 0) {
        rbuf = new Float64Array(rcount);
        for(i = 0; i < rcount; i++) {
          // Get the radius
          a = data.radius[i];
          
          // Check that it's a number, finite, and greater than zero
          if (typeof a !== "number") {
            syntax("Radii must be numbers");
          }
          if (!isFinite(a)) {
            syntax("Radii must be finite");
          }
          if (!(a > 0.0)) {
            syntax("Radii must be greater than zero");
          }
          
          // Store the radius
          rbuf[i] = a;
        }
      }
      
      // If there is at least one point style defined, define the point
      // style table, checking that point styles are valid; otherwise,
      // set the point styles table to an empty array
      ps = [];
      for(i = 0; i < pscount; i++) {
        // Get the current style object
        o = data.pstyle[i];
        
        // Make sure style is an object
        if ((typeof o != "object") || (o instanceof Array)) {
          syntax("Point styles must be objects");
        }
        
        // Must have "shape" "size" and "stroke" properties
        if (!("shape" in o)) {
          syntax("All point styles must have shape property");
        }
        if (!("size" in o)) {
          syntax("All point styles must have size property");
        }
        if (!("stroke" in o)) {
          syntax("All point styles must have stroke property");
        }
        
        // Get the core property values
        a = o.shape;
        b = o.size;
        c = o.stroke;
        
        // Make sure that shape is a string with one character that is
        // a valid shape code
        if (typeof a !== "string") {
          syntax("Point style shape code must be string");
        }
        if (a.length !== 1) {
          syntax("Point style shape code must be one character");
        }
        if (VALID_SHAPES.indexOf(a) < 0) {
          syntax("Invalid shape code '" + a + "' in point style");
        }
        
        // Make sure size is a finite number that is greater than zero
        if (typeof b !== "number") {
          syntax("Point style size must be number");
        }
        if (!isFinite(b)) {
          syntax("Point style size must be finite");
        }
        if (!(b > 0.0)) {
          syntax("Point style size must be greater than zero");
        }
        
        // Make sure stroke is a finite number that is greater than or
        // equal to zero
        if (typeof c !== "number") {
          syntax("Point style stroke must be number");
        }
        if (!isFinite(c)) {
          syntax("Point style stroke must be finite");
        }
        if (!(c >= 0.0)) {
          syntax("Point style stroke must be zero or greater");
        }
        
        // If this shape is a filled shape, there must be a "fill"
        // property, which should be floored to a finite integer that is
        // either 15-bit or 0xffff; if the shape is not a filled shape,
        // there must not be a "fill" property
        x = 0;
        if (FILL_SHAPES.indexOf(a) >= 0) {
          // Fill shape, so must have property
          if (!("fill" in o)) {
            syntax("Point style must have fill for filled shapes");
          }
          
          // Get the fill property
          x = o.fill;
          
          // Make sure it is a number
          if (typeof x !== "number") {
            syntax("Point style fill must be number");
          }
          
          // Floor it
          x = Math.floor(x);
          
          // Make sure it is finite
          if (!isFinite(x)) {
            syntax("Point style fill must be finite integer");
          }
          
          // Make sure 15-bit or 0xffff
          if (((x < 0) || (x > 0x7fff)) && (x !== 0xffff)) {
            syntax("Point style fill must be 15-bit or 65535");
          }
          
        } else {
          // Not a fill shape, so must not have property
          if ("fill" in o) {
            syntax("Point style may not have fill for unfilled shapes");
          }
        }
        
        // If the stroke size is greater than zero, there must be an
        // "ink" property, which should be floored to a finite integer
        // that is 15-bit; if the stroke size is zero, there must not be
        // an "ink" property
        y = 0;
        if (c > 0.0) {
          // Stroke, so must have property
          if (!("ink" in o)) {
            syntax("Point style with stroke must have ink");
          }
          
          // Get the ink property
          y = o.fill;
          
          // Make sure it is a number
          if (typeof y !== "number") {
            syntax("Point style ink must be number");
          }
          
          // Floor it
          y = Math.floor(y);
          
          // Make sure it is finite
          if (!isFinite(y)) {
            syntax("Point style ink must be finite integer");
          }
          
          // Make sure 15-bit
          if ((y < 0) || (y > 0x7fff)) {
            syntax("Point style ink must be 15-bit");
          }
          
        } else {
          // No stroke, so must not have property
          if ("ink" in o) {
            syntax("Point style with zero stroke may not have ink");
          }
        }
        
        // Now create a new object and fill it with the checked and
        // possibly adjusted properties
        o = {};
        
        o.shape  = a;
        o.size   = b;
        o.stroke = c;
        
        if (FILL_SHAPES.indexOf(a) >= 0) {
          o.fill = x;
        }
        if (c > 0.0) {
          o.ink  = y;
        }
        
        // Push the new style to the end of the point styles array
        ps.push(o);
      }
      
      // If there is at least one line style defined, define the line
      // style table, checking that line styles are valid; otherwise,
      // set the line styles table to an empty array
      ls = [];
      for(i = 0; i < lscount; i++) {
        // Get the current style object
        o = data.lstyle[i];
        
        // Make sure style is an object
        if ((typeof o != "object") || (o instanceof Array)) {
          syntax("Line styles must be objects");
        }
        
        // Must have "width" and "color" properties
        if (!("width" in o)) {
          syntax("All line styles must have width property");
        }
        if (!("color" in o)) {
          syntax("All line styles must have color property");
        }
        
        // Get the property values
        a = o.width;
        b = o.color;
        
        // Make sure both properties are numbers
        if (typeof a !== "number") {
          syntax("Line style width must be number");
        }
        if (typeof b !== "number") {
          syntax("Line style color must be number");
        }
        
        // Make sure width is a finite value that is greater than zero
        if (!isFinite(a)) {
          syntax("Line style width must be finite");
        }
        if (!(a > 0.0)) {
          syntax("Line style width must be greater than zero");
        }
        
        // Floor color and make sure it's finite
        b = Math.floor(b);
        if (!isFinite(b)) {
          syntax("Line style color must be finite integer");
        }
        
        // Make sure color is 15-bit
        if ((b < 0) || (b > 0x7fff)) {
          syntax("Line style color must be 15-bit HiColor");
        }
        
        // Now create a new object and fill it with the checked and
        // possibly adjusted properties
        o = {};
        
        o.width = a;
        o.color = b;
        
        // Push the new style to the end of the line styles array
        ls.push(o);
      }
      
      // If we got here without exception, everything has been loaded
      // successfully, so store all the data in the module and set the
      // loaded flag
      m_vtx = vtx;
      m_tvx = new Float64Array(vtx.length);
      m_rad = rbuf;
      m_scene = scene;
      m_paint = new Uint32Array(scount);
      m_pstyle = ps;
      m_lstyle = ls;
      
      m_loaded = true;
      
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
    
    var func_name = "loadDefaultScene";
    var x, z;
    var str;
    
    var vtx;
    var scene;
    var o;
    
    // The first 121 vertices in the vertex array form a 10x10 grid on
    // the XZ plane with spacing 5 units apart
    vtx = [];
    for(x = -25; x <= 25; x += 5) {
      for(z = -25; z <= 25; z += 5) {
        vtx.push(x);
        vtx.push(0);
        vtx.push(z);
      }
    }
    
    // The last two vertices are for the Y axis
    vtx.push(0); vtx.push( 25); vtx.push(0);
    vtx.push(0); vtx.push(-25); vtx.push(0);
    
    // Add point objects with point style zero for each node on the
    // grid, except for the very center where the Y axis will be
    scene = [];
    for(x = 0; x < 11; x++) {
      for(z = 0; z < 11; z++) {
        if ((x === 5) && (z === 5)) {
          continue;
        }
        scene.push((x * 11) + z);
        scene.push(0xffff);
        scene.push(0xffff);
        scene.push(0);
        scene.push(0);
      }
    }
    
    // Add line object with line style zero for the Y axis
    scene.push(121);
    scene.push(122);
    scene.push(0xffff);
    scene.push(0);
    scene.push(0);
    
    // Create object for the default scene and add both the scene and
    // vertex arrays to it, along with empty line and point style arrays
    o = {};
    o.vertex = vtx;
    o.scene  = scene;
    o.pstyle = [];
    o.lstyle = [];
    
    // Add the point style for blue circles of 2D size 3.0
    o.pstyle.push({
      "shape"  : "c",
      "size"   : 3,
      "stroke" : 0,
      "fill"   : 31
    });
    
    // Add the line style for a green line of 2D width 2.0
    o.lstyle.push({
      "width" : 2.0,
      "color" : 992
    });
    
    // Encode the default scene into JSON
    str = JSON.stringify(o);
    
    // Load the default scene, which shouldn't fail
    if (!loadScene(str)) {
      fault(func_name, 100);
    }
  }
  
  /*
   * Export declarations
   * ===================
   * 
   * All exports are declared within a global "dla_main" object.
   */
  window.dla_main = {
    "renderScene": renderScene,
    "getCamera": getCamera,
    "setCamera": setCamera,
    "loadError": loadError,
    "loadScene": loadScene,
    "loadDefaultScene": loadDefaultScene
  };
  
}());
