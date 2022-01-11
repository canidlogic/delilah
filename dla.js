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
   * Matrix class
   * ============
   */
  
  /*
   * Constructor.
   * 
   * Invoke as "new Matrix"
   * 
   * The matrix is initialized as the 4x4 identity matrix.
   */
  function Matrix() {
    
    this._m = [1, 0, 0, 0,
               0, 1, 0, 0,
               0, 0, 1, 0,
               0, 0, 0, 1];
  }
  
  /*
   * Report an error to console and throw an exception for a fault
   * occurring within this Matrix class.
   *
   * Parameters:
   *
   *   func_name : string - the name of the function in this class
   *
   *   loc : number(int) - the location within the function
   */
  Matrix.prototype._fault = function(func_name, loc) {
    
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
                  " in dla_main:Matrix");
    
    // Throw exception
    throw ("dla_main:Matrix:" + func_name + ":" + String(loc));
  };
  
  /*
   * Private function that post-multiplies another 4x4 matrix to this
   * one and stores the result in this matrix.
   * 
   * The given parameter must be an array of 16 elements where each
   * element is a Number.  This function does NOT check that all numbers
   * are finite and does NOT check that the results of computations are
   * all finite.
   * 
   * Parameters:
   * 
   *   b : array - the 4x4 matrix to post-multiply to this one
   */
  Matrix.prototype._mul = function(b) {
    
    var func_name = "_mul";
    var i, j, v, result;
    
    // Check parameter
    if ((typeof b !== "object") || (!(b instanceof Array))) {
      this._fault(func_name, 100);
    }
    
    if (b.length !== 16) {
      this._fault(func_name, 101);
    }
    
    for(i = 0; i < b.length; i++) {
      if (typeof b[i] !== "number") {
        this._fault(func_name, 102);
      }
    }
    
    // Define result array
    result = new Array(16);
    
    // Compute each element of result array
    for(i = 0; i < 4; i++) {
      for(j = 0; j < 4; j++) {
        v =
          (this._m[(4 * i)    ] * b[j     ]) +
          (this._m[(4 * i) + 1] * b[j +  4]) +
          (this._m[(4 * i) + 2] * b[j +  8]) +
          (this._m[(4 * i) + 3] * b[j + 12]);
        
        result[(4 * i) + j] = v;
      }
    }
    
    // Replace this array value with the result
    this._m = result;
  };
  
  /*
   * Return a string representation of the matrix.
   * 
   * Return:
   * 
   *   a string representation of the matrix, for use in debugging
   */
  Matrix.prototype.toString = function() {
    
    var i;
    var str = "[";
    
    for(i = 0; i < 16; i++) {
      if (i > 0) {
        if ((i % 4) === 0) {
          str = str + "\n ";
        } else {
          str = str + " ";
        }
      }
      str = str + this._m[i].toFixed(3);
    }
    
    str = str + "]";
    
    return str;
  };
  
  /*
   * Check whether all elements currently in the matrix have finite
   * values.
   * 
   * Return:
   * 
   *   true if everything is finite, false if not
   */
  Matrix.prototype.checkFinite = function() {
    
    var i;
    var result = true;
    
    for(i = 0; i < 16; i++) {
      if (!isFinite(this._m[i])) {
        result = false;
        break;
      }
    }
    
    return result;
  };
  
  /*
   * Given an array object with three elements storing X, Y, Z
   * coordinates, transform it by interpreting it as a row vector and
   * post-multiplying it by the current matrix value.
   * 
   * The matrix value is not changed by this function.
   * 
   * When multiplied through, the array object is assumed to have a
   * fourth element that has a value of 1.  After multiplication, the
   * first three elements are divided by the fourth element so that the
   * fourth element is once again one.  The client never sees this
   * fourth element, and the passed array reference always remains to an
   * array of three elements.
   * 
   * If the fourth element after multiplication ends up as zero, all
   * three coordinates are set to zero in the result.
   * 
   * If computation results in any non-finite coordinates, the
   * non-finite coordinates are replaced by zero in the result.  This
   * way, the transformed array always contains finite values, even if
   * it didn't have finite values going into this function.
   * 
   * Parameters:
   * 
   *   pa : Array - array of three numbers representing XYZ coordinates
   *   that will be transformed in-place by post-multiplication by this
   *   matrix
   */
  Matrix.prototype.process = function(pa) {
    
    var func_name = "process";
    var a, b, c, d;
    
    // Check parameter
    if ((typeof pa !== "object") || (!(pa instanceof Array))) {
      this._fault(func_name, 100);
    }
    if (pa.length !== 3) {
      this._fault(func_name, 101);
    }
    if ((typeof pa[0] !== "number") ||
        (typeof pa[1] !== "number") ||
        (typeof pa[2] !== "number")) {
      this._fault(func_name, 102);
    }
    
    // Compute the four coordinates of the result
    a = (pa[0] * this._m[ 0]) +
        (pa[1] * this._m[ 4]) +
        (pa[2] * this._m[ 8]) +
                 this._m[12];
    
    b = (pa[0] * this._m[ 1]) +
        (pa[1] * this._m[ 5]) +
        (pa[2] * this._m[ 9]) +
                 this._m[13];
    
    c = (pa[0] * this._m[ 2]) +
        (pa[1] * this._m[ 6]) +
        (pa[2] * this._m[10]) +
                 this._m[14];
    
    d = (pa[0] * this._m[ 3]) +
        (pa[1] * this._m[ 7]) +
        (pa[2] * this._m[11]) +
                 this._m[15];
    
    // Handle the fourth coordinate if it is not one
    if (d == 0.0) {
      // Division by zero would result, so set to (0, 0, 0)
      a = 0.0;
      b = 0.0;
      c = 0.0;
      
    } else if (d != 1.0) {
      // Divide by d
      a = a / d;
      b = b / d;
      c = c / d;
    }
    
    // Change non-finite values to zero
    if (!isFinite(a)) {
      a = 0.0;
    }
    if (!isFinite(b)) {
      b = 0.0;
    }
    if (!isFinite(c)) {
      c = 0.0;
    }
    
    // Update array
    pa[0] = a;
    pa[1] = b;
    pa[2] = c;
  };
  
  /*
   * Post-multiply this matrix by a translation matrix.
   * 
   * tx, ty, tz are the amounts to translate each axis.
   * 
   * This function does NOT check that the result is finite, nor does it
   * check that the parameters are finite.
   * 
   * Parameters:
   * 
   *   tx : number - the X translation
   * 
   *   ty : number - the Y translation
   * 
   *   tz : number - the Z translation
   */
  Matrix.prototype.translate = function(tx, ty, tz) {
    
    var func_name = "translate";
    
    // Check parameters
    if ((typeof tx !== "number") ||
        (typeof ty !== "number") ||
        (typeof tz !== "number")) {
      this._fault(func_name, 100);
    }
    
    // Modify this matrix
    this._mul([
       1,  0,  0, 0,
       0,  1,  0, 0,
       0,  0,  1, 0,
      tx, ty, tz, 1
    ]);
  };
  
  /*
   * Post-multiply this matrix by a scaling matrix.
   * 
   * sx, sy, sz are the amounts to scale each axis.
   * 
   * This function does NOT check that the result is finite, nor does it
   * check that the parameters are finite.
   * 
   * Parameters:
   * 
   *   sx : number - the X scaling multiplier
   * 
   *   sy : number - the Y scaling multiplier
   * 
   *   sz : number - the Z scaling multiplier
   */
  Matrix.prototype.scale = function(sx, sy, sz) {
    
    var func_name = "scale";
    
    // Check parameters
    if ((typeof sx !== "number") ||
        (typeof sy !== "number") ||
        (typeof sz !== "number")) {
      this._fault(func_name, 100);
    }
    
    // Modify this matrix
    this._mul([
      sx,  0,  0, 0,
       0, sy,  0, 0,
       0,  0, sz, 0,
       0,  0,  0, 1
    ]);
  };
  
  /*
   * Post-multiply this matrix by a projection matrix.
   * 
   * d is the distance from the screen to the projection point.  It
   * should be greater than zero.  The projection matrix will be such
   * that the screen is positioned at Z=0 and the projection point is
   * positioned at Z=d (so that the image is NOT flipped).
   * 
   * This function does NOT check that the result is finite, nor does it
   * check that the parameter is finite or in range.
   * 
   * Parameters:
   * 
   *   d : number - the distance to the screen
   */
  Matrix.prototype.project = function(d) {
    
    var func_name = "project";
    
    // Check parameters
    if (typeof d !== "number") {
      this._fault(func_name, 100);
    }
    
    // Modify this matrix
    this._mul([
      1, 0, 0,        0,
      0, 1, 0,        0,
      0, 0, 1, -(1 / d),
      0, 0, 0,        1
    ]);
  };
  
  /*
   * Post-multiply this matrix by a rotation matrix about the X axis.
   * 
   * r is the angle of rotation, in radians.
   * 
   * This function does NOT check that the result is finite, nor does it
   * check that the parameter is finite.
   * 
   * Parameters:
   * 
   *   r : number - the radians of rotation
   */
  Matrix.prototype.rotateX = function(r) {
    
    var func_name = "rotateX";
    
    // Check parameters
    if (typeof r !== "number") {
      this._fault(func_name, 100);
    }
    
    // Modify this matrix
    this._mul([
      1,              0,           0, 0,
      0,   Math.cos(r) , Math.sin(r), 0,
      0, -(Math.sin(r)), Math.cos(r), 0,
      0,              0,           0, 1
    ]);
  };
  
  /*
   * Post-multiply this matrix by a rotation matrix about the Y axis.
   * 
   * r is the angle of rotation, in radians.
   * 
   * This function does NOT check that the result is finite, nor does it
   * check that the parameter is finite.
   * 
   * Parameters:
   * 
   *   r : number - the radians of rotation
   */
  Matrix.prototype.rotateY = function(r) {
    
    var func_name = "rotateY";
    
    // Check parameters
    if (typeof r !== "number") {
      this._fault(func_name, 100);
    }
    
    // Modify this matrix
    this._mul([
      Math.cos(r), 0, -(Math.sin(r)), 0,
                0, 1,              0, 0,
      Math.sin(r), 0,   Math.cos(r) , 0,
                0, 0,              0, 1
    ]);
  };
  
  /*
   * Post-multiply this matrix by a rotation matrix about the Z axis.
   * 
   * r is the angle of rotation, in radians.
   * 
   * This function does NOT check that the result is finite, nor does it
   * check that the parameter is finite.
   * 
   * Parameters:
   * 
   *   r : number - the radians of rotation
   */
  Matrix.prototype.rotateZ = function(r) {
    
    var func_name = "rotateZ";
    
    // Check parameters
    if (typeof r !== "number") {
      this._fault(func_name, 100);
    }
    
    // Modify this matrix
    this._mul([
        Math.cos(r) , Math.sin(r), 0, 0,
      -(Math.sin(r)), Math.cos(r), 0, 0,
                   0,           0, 1, 0,
                   0,           0, 0, 1
    ]);
  };
  
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
   * The background color.
   * 
   * This is what the canvas is cleared to before any scene objects are
   * rendered.
   * 
   * This is an array of three integers in range [0, 255] that represent
   * the R G B color channels.
   */
  var m_bgcolor = [170, 170, 170];
  
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
   * The 3D projection.
   * 
   * The first number is the field of view angle of the vertical axis.
   * It is normalized so that 0.0 means zero degrees/radians and 1.0
   * means 180 degrees/PI radians.  Value must be greater than zero and
   * less than one.
   * 
   * The second number is the near plane Z location.  It must be less
   * than one divided by the tangent of half the field of view angle.
   * 
   * The third number is the far plane Z location.  It must be less than
   * the near plane Z location.
   */
  var m_proj = [0.25, 0.0, -100.0];
  
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
   * Projected vertex buffer.
   * 
   * Only available if m_loaded.
   * 
   * This is a Float64Array with the same number of elements as m_tvx.
   * During a rendering operation, this will be filled with projection
   * transformed vertices.
   */
  var m_pvx;
  
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
   * Draw a triangle.
   * 
   * rc is the rendering context to draw the triangle into.  The
   * triangle vertices are (x1, y1), (x2, y2), and (x3, y3) in screen
   * coordinates.
   * 
   * fc is the fill color of the triangle, which is 15-bit HiColor.
   * 
   * sw is the style word, which has three 5-bit selectors for edge
   * styles.  See m_scene documentation for further information.
   * 
   * CAUTION:  For speed, this function performs no checking of
   * parameters or state.
   * 
   * CAUTION: Fill style, stroke style, line width, and current path in
   * the rendering context are altered.
   * 
   * CAUTION: Assumes settings for lineCap, lineJoin, and miterLimit are
   * already set correctly.
   * 
   * Parameters:
   * 
   *   rc : CanvasRenderingContext2D - the 2D rendering context
   * 
   *   x1 : the X coordinate of the first vertex
   * 
   *   y1 : the Y coordinate of the first vertex
   * 
   *   x2 : the X coordinate of the second vertex
   * 
   *   y2 : the Y coordinate of the second vertex
   * 
   *   x3 : the X coordinate of the third vertex
   * 
   *   y3 : the Y coordinate of the third vertex
   * 
   *   fc : the fill color
   * 
   *   sw : the triangle style word
   */
  function drawTri(rc, x1, y1, x2, y2, x3, y3, fc, sw) {
    
    var rgb, r, g, b;
    var s1, s2, s3, si;
    
    // Draw the full triangle shape in a new path
    rc.beginPath();
    rc.moveTo(x1, y1);
    rc.lineTo(x2, y2);
    rc.lineTo(x3, y3);
    rc.closePath();
    
    // Extract 5-bit channels from fill color
    r = (fc >> 10);
    g = (fc >> 5) & 0x1f;
    b = fc & 0x1f;
    
    // Expand 5-bit channels to 8-bit by shifting left and duplicating
    // three most significant bits in least significant
    r = (r << 3) | (r >> 2);
    g = (g << 3) | (g >> 2);
    b = (b << 3) | (b >> 2);
    
    // Set fill color
    rc.fillStyle = "rgb(" + r.toString(10) +
                      ", " + g.toString(10) +
                      ", " + b.toString(10) + ")";
    
    // Fill the triangle
    rc.fill();
    
    // If style word is not zero, do edge rendering
    if (sw > 0) {
    
      // Extract the three selectors from the style word
      s1 = (sw >> 10);
      s2 = (sw >> 5) & 0x1f;
      s3 = sw & 0x1f;
    
      // Render first edge if non-zero
      if (s1 > 0) {
        // Get style object
        si = m_lstyle[s1 - 1];
        
        // Begin a new path with just the edge
        rc.beginPath();
        rc.moveTo(x1, y1);
        rc.lineTo(x2, y2);
        
        // Get line color
        rgb = si.color;
        
        // Extract 5-bit channels
        r = (rgb >> 10);
        g = (rgb >> 5) & 0x1f;
        b = rgb & 0x1f;
        
        // Expand 5-bit channels to 8-bit by shifting left and duplicating
        // three most significant bits in least significant
        r = (r << 3) | (r >> 2);
        g = (g << 3) | (g >> 2);
        b = (b << 3) | (b >> 2);
        
        // Set line color
        rc.strokeStyle = "rgb(" + r.toString(10) +
                          ", " + g.toString(10) +
                          ", " + b.toString(10) + ")";
        
        // Set line width
        rc.lineWidth = si.width;
        
        // Stroke the line
        rc.stroke();
      }
      
      // Render second edge if non-zero
      if (s2 > 0) {
        // Get style object
        si = m_lstyle[s2 - 1];
        
        // Begin a new path with just the edge
        rc.beginPath();
        rc.moveTo(x2, y2);
        rc.lineTo(x3, y3);
        
        // Get line color
        rgb = si.color;
        
        // Extract 5-bit channels
        r = (rgb >> 10);
        g = (rgb >> 5) & 0x1f;
        b = rgb & 0x1f;
        
        // Expand 5-bit channels to 8-bit by shifting left and duplicating
        // three most significant bits in least significant
        r = (r << 3) | (r >> 2);
        g = (g << 3) | (g >> 2);
        b = (b << 3) | (b >> 2);
        
        // Set line color
        rc.strokeStyle = "rgb(" + r.toString(10) +
                          ", " + g.toString(10) +
                          ", " + b.toString(10) + ")";
        
        // Set line width
        rc.lineWidth = si.width;
        
        // Stroke the line
        rc.stroke();
      }
      
      // Render third edge if non-zero
      if (s3 > 0) {
        // Get style object
        si = m_lstyle[s3 - 1];
        
        // Begin a new path with just the edge
        rc.beginPath();
        rc.moveTo(x3, y3);
        rc.lineTo(x1, y1);
        
        // Get line color
        rgb = si.color;
        
        // Extract 5-bit channels
        r = (rgb >> 10);
        g = (rgb >> 5) & 0x1f;
        b = rgb & 0x1f;
        
        // Expand 5-bit channels to 8-bit by shifting left and duplicating
        // three most significant bits in least significant
        r = (r << 3) | (r >> 2);
        g = (g << 3) | (g >> 2);
        b = (b << 3) | (b >> 2);
        
        // Set line color
        rc.strokeStyle = "rgb(" + r.toString(10) +
                          ", " + g.toString(10) +
                          ", " + b.toString(10) + ")";
        
        // Set line width
        rc.lineWidth = si.width;
        
        // Stroke the line
        rc.stroke();
      }
    }
  }
  
  /*
   * Draw a line.
   * 
   * rc is the rendering context to draw the line into.  The line goes
   * from (x1, y1) to (x2, y2) in screen coordinates.
   * 
   * si is an index into the line style array.
   * 
   * CAUTION:  For speed, this function performs no checking of
   * parameters or state.
   * 
   * CAUTION: Stroke style, line width, and current path in the
   * rendering context are altered.
   * 
   * CAUTION: Assumes settings for lineCap, lineJoin, and miterLimit are
   * already set correctly.
   * 
   * Parameters:
   * 
   *   rc : CanvasRenderingContext2D - the 2D rendering context
   * 
   *   x1 : the X coordinate of the start point
   * 
   *   y1 : the Y coordinate of the start point
   * 
   *   x2 : the X coordinate of the end point
   * 
   *   y2 : the Y coordinate of the end point
   * 
   *   si : the line style index
   */
  function drawLine(rc, x1, y1, x2, y2, si) {
    
    var rgb, r, g, b;
    
    // Get line style object
    si = m_lstyle[si];
    
    // Define new path and add the line to the path
    rc.beginPath();
    rc.moveTo(x1, y1);
    rc.lineTo(x2, y2);
    
    // Get line color
    rgb = si.color;
    
    // Extract 5-bit channels
    r = (rgb >> 10);
    g = (rgb >> 5) & 0x1f;
    b = rgb & 0x1f;
    
    // Expand 5-bit channels to 8-bit by shifting left and duplicating
    // three most significant bits in least significant
    r = (r << 3) | (r >> 2);
    g = (g << 3) | (g >> 2);
    b = (b << 3) | (b >> 2);
    
    // Set line color
    rc.strokeStyle = "rgb(" + r.toString(10) +
                      ", " + g.toString(10) +
                      ", " + b.toString(10) + ")";
    
    // Set line width
    rc.lineWidth = si.width;
    
    // Stroke the line
    rc.stroke();
  }
  
  /*
   * Draw a sphere.
   * 
   * rc is the rendering context to draw the sphere into.  (x, y) are
   * the screen coordinates of the sphere, and r is the screen radius of
   * the sphere.
   * 
   * fc is the fill color of the sphere, which is either 0xffff for no
   * fill or a 15-bit HiColor value.
   * 
   * si is the stroke style for the sphere outline, which is either
   * 0xffff for no stroke outline or an index into the line style array.
   * 
   * CAUTION:  For speed, this function performs no checking of
   * parameters or state.
   * 
   * CAUTION: Fill style, stroke style, line width, and current path in
   * the rendering context are altered.
   * 
   * CAUTION: Assumes settings for lineCap, lineJoin, and miterLimit are
   * already set correctly.
   * 
   * Parameters:
   * 
   *   rc : CanvasRenderingContext2D - the 2D rendering context
   * 
   *   x : the X coordinate
   * 
   *   y : the Y coordinate
   * 
   *   r : the radius
   * 
   *   fc : the 15-bit HiColor fill color of the sphere or 0xffff
   * 
   *   si : the line style index or 0xffff
   */
  function drawSphere(rc, x, y, r, fc, si) {
    
    var r, g, b, rgb;
    
    // Begin new path and add the circle to it
    rc.beginPath();
    rc.arc(x, y, r, 0, 2 * Math.PI);
    
    // Fill sphere if requested
    if (fc !== 0xffff) {
      // Extract 5-bit channels
      r = (fc >> 10);
      g = (fc >> 5) & 0x1f;
      b = fc & 0x1f;
      
      // Expand 5-bit channels to 8-bit by shifting left and duplicating
      // three most significant bits in least significant
      r = (r << 3) | (r >> 2);
      g = (g << 3) | (g >> 2);
      b = (b << 3) | (b >> 2);
      
      // Set fill color
      rc.fillStyle = "rgb(" + r.toString(10) +
                      ", " + g.toString(10) +
                      ", " + b.toString(10) + ")";
      
      // Fill the circle
      rc.fill();
    }
    
    // Stroke sphere if requested
    if (si !== 0xffff) {
    
      // Get line style object
      si = m_lstyle[si];
      
      // Get color
      rgb = si.color;
      
      // Extract 5-bit channels
      r = (rgb >> 10);
      g = (rgb >> 5) & 0x1f;
      b = rgb & 0x1f;
      
      // Expand 5-bit channels to 8-bit by shifting left and duplicating
      // three most significant bits in least significant
      r = (r << 3) | (r >> 2);
      g = (g << 3) | (g >> 2);
      b = (b << 3) | (b >> 2);
      
      // Set stroke color
      rc.strokeStyle = "rgb(" + r.toString(10) +
                        ", " + g.toString(10) +
                        ", " + b.toString(10) + ")";
      
      // Set line width
      rc.lineWidth = si.width;
      
      // Stroke the circle
      rc.stroke();
    }
  }
  
  /*
   * Draw a point.
   * 
   * rc is the rendering context to draw the point into.  (x, y) are the
   * screen coordinates of the point.
   * 
   * psi is the point style, which is an index into the point style
   * array.
   * 
   * CAUTION:  For speed, this function performs no checking of
   * parameters or state.
   * 
   * CAUTION: Fill style, stroke style, line width, and current path in
   * the rendering context are altered.
   * 
   * CAUTION: Assumes settings for lineCap, lineJoin, and miterLimit are
   * already set correctly.
   * 
   * Parameters:
   * 
   *   rc : CanvasRenderingContext2D - the 2D rendering context
   * 
   *   x : the X coordinate
   * 
   *   y : the Y coordinate
   * 
   *   psi : the point style index
   */
  function drawPoint(rc, x, y, psi) {
    
    var func_name = "drawPoint";
    var sz, sh, k, rgb, r, g, b;
    
    // Get point style object
    psi = m_pstyle[psi];
    
    // Get the size of the bounding box edge and half of it
    sz = psi.size;
    k = sz / 2.0;
    
    // Define new path and add the appropriate shape to the path
    rc.beginPath();
    sh = psi.shape;
    if (sh === "c") {
      // Circle
      k = sz / 2.0;
      rc.arc(x, y, k, 0, 2 * Math.PI);
      
    } else if (sh === "s") {
      // Square
      k = sz / 2.0;
      rc.rect(x - k, y - k, sz, sz);
      
    } else if (sh === "m") {
      // Diamond
      rc.moveTo(x - k, y);
      rc.lineTo(x, y - k);
      rc.lineTo(x + k, y);
      rc.lineTo(x, y + k);
      rc.closePath();
      
    } else if (sh === "u") {
      // Triangle-up
      rc.moveTo(x - k, y + k);
      rc.lineTo(x, y - k);
      rc.lineTo(x + k, y + k);
      rc.closePath();
      
    } else if (sh === "d") {
      // Triangle-down
      rc.moveTo(x - k, y - k);
      rc.lineTo(x, y + k);
      rc.lineTo(x + k, y - k);
      rc.closePath();
      
    } else if (sh === "l") {
      // Triangle-left
      rc.moveTo(x - k, y);
      rc.lineTo(x + k, y - k);
      rc.lineTo(x + k, y + k);
      rc.closePath();
      
    } else if (sh === "r") {
      // Triangle-right
      rc.moveTo(x + k, y);
      rc.lineTo(x - k, y - k);
      rc.lineTo(x - k, y + k);
      rc.closePath();
      
    } else if (sh === "p") {
      // Plus
      rc.moveTo(x, y - k);
      rc.lineTo(x, y + k);
      rc.moveTo(x - k, y);
      rc.lineTo(x + k, y);
      
    } else if (sh === "x") {
      // X
      rc.moveTo(x - k, y - k);
      rc.lineTo(x + k, y + k);
      rc.moveTo(x - k, y + k);
      rc.lineTo(x + k, y - k);
      
    } else {
      fault(func_name, 200);
    }
    
    // If this is a fillable shape, do fill if requested by style
    if (FILL_SHAPES.indexOf(sh) >= 0) {
      rgb = psi.fill;
      if (rgb !== 0xffff) {
        // Extract 5-bit channels
        r = (rgb >> 10);
        g = (rgb >> 5) & 0x1f;
        b = rgb & 0x1f;
        
        // Expand 5-bit channels to 8-bit by shifting left and
        // duplicating three most significant bits in least significant
        r = (r << 3) | (r >> 2);
        g = (g << 3) | (g >> 2);
        b = (b << 3) | (b >> 2);
        
        // Set fill color
        rc.fillStyle = "rgb(" + r.toString(10) +
                        ", " + g.toString(10) +
                        ", " + b.toString(10) + ")";
        
        // Fill the shape
        rc.fill();
      }
    }
    
    // If stroke width is greater than zero, stroke the shape
    sz = psi.stroke;
    if (sz > 0.0) {
      // Get stroke color
      rgb = psi.ink;
      
      // Extract 5-bit channels
      r = (rgb >> 10);
      g = (rgb >> 5) & 0x1f;
      b = rgb & 0x1f;
      
      // Expand 5-bit channels to 8-bit by shifting left and duplicating
      // three most significant bits in least significant
      r = (r << 3) | (r >> 2);
      g = (g << 3) | (g >> 2);
      b = (b << 3) | (b >> 2);
      
      // Set stroke color
      rc.strokeStyle = "rgb(" + r.toString(10) +
                        ", " + g.toString(10) +
                        ", " + b.toString(10) + ")";
      
      // Set line width
      rc.lineWidth = sz;
      
      // Stroke the shape
      rc.stroke();
    }
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
    
    var func_name = "renderScene";
    var i, j, k, k_max, p, x, y, z, r;
    var a, b, c, d, e, bi;
    var z0, z1, z2, z3;
    var x0, y0, x1, y1, x2, y2, x3, y3;
    var t1, t2, t3;
    var e1x, e1y, e1z, e2x, e2y, e2z;
    var near, far, extent;
    var proj_d, rad_mul;
    var mtxCam, mtxProj;
    
    // Check parameters and convert to integers
    if ((typeof rc !== "object") ||
        (typeof w !== "number") ||
        (typeof h !== "number")) {
      fault(func_name, 100);
    }
    
    if (!(rc instanceof CanvasRenderingContext2D)) {
      fault(func_name, 101);
    }
    
    w = Math.floor(w);
    h = Math.floor(h);
    
    if ((!isFinite(w)) || (!isFinite(h))) {
      fault(func_name, 102);
    }
    
    if ((w < 2) || (h < 2)) {
      fault(func_name, 103);
    }
    
    // First thing is always to clear the canvas to the background color
    rc.fillStyle = "rgb(" + m_bgcolor[0].toString(10) + 
                    ", " + m_bgcolor[1].toString(10) +
                    ", " + m_bgcolor[2].toString(10) + ")";
    rc.fillRect(0, 0, w, h);
    
    // Only proceed further if scene is loaded
    if (m_loaded) {
      
      // Define the matrix that will transform world space to camera
      // space, where the camera is perfectly level at the origin
      // looking exactly down towards negative Z infinity (right-handed)
      mtxCam = new Matrix;
      
      // First step is to translate so that camera is at origin
      mtxCam.translate(-(m_cam[0]), -(m_cam[1]), -(m_cam[2]));
      
      // Next, undo the yaw by rotating around Y axis
      mtxCam.rotateY(-(m_cam[3] * Math.PI * 2));
      
      // Next, undo the pitch by rotating around the X axis
      mtxCam.rotateX(-(m_cam[4] * Math.PI / 2));
      
      // Finally, undo the roll by rotating around the Z axis
      mtxCam.rotateZ(-(m_cam[5] * Math.PI * 2));
      
      // If matrix is not finite, stop
      if (!mtxCam.checkFinite()) {
        return;
      }
      
      // Define the matrix that will transform camera space into
      // projected screen space
      mtxProj = new Matrix;
      
      // First step is the projection matrix
      mtxProj.project(1 / Math.tan(m_proj[0] * Math.PI / 2));
      
      // Next scale X and Y by half the height to get to screen
      // dimensions, and also flip Y
      mtxProj.scale(h / 2, -(h / 2), 1);
      
      // Finally, adjust origin so origin is top-left of screen
      mtxProj.translate(w / 2, h / 2, 0);
      
      // Transform all vertices in the vertex buffer both into the
      // camera-transformed buffer m_tvx and the projected buffer m_pvx
      j = m_vtx.length;
      p = new Array(3);
      for(i = 0; i < j; i = i + 3) {
        p[0] = m_vtx[i    ];
        p[1] = m_vtx[i + 1];
        p[2] = m_vtx[i + 2];
        
        mtxCam.process(p);
        
        m_tvx[i    ] = p[0];
        m_tvx[i + 1] = p[1];
        m_tvx[i + 2] = p[2];
        
        mtxProj.process(p);
        
        m_pvx[i    ] = p[0];
        m_pvx[i + 1] = p[1];
        m_pvx[i + 2] = p[2];
      }
      
      // Cache near and far clipping planes and distance between
      near   = m_proj[1];
      far    = m_proj[2];
      extent = near - far;
      
      // Cache values used in calculating projected sphere radii
      proj_d  = 1 / Math.tan(m_proj[0] * Math.PI / 2);
      rad_mul = (proj_d * h) / 2.0;
      
      // Fill the paint sorting list by going through all scene objects,
      // applying backface cull to triangles and then near/far full
      // plane clipping to all objects, and either discarding each scene
      // object by writing the special 0xffffffff to the m_paint list,
      // or adding the object with the quantized centroid Z clamped to
      // normalized range in the most significant word and the index of
      // the object in the least significant word
      j = m_scene.length / 5;
      for(i = 0; i < j; i++) {
        
        // Get this scene object's vertices
        bi = i * 5;
        a = m_scene[bi    ];
        b = m_scene[bi + 1];
        c = m_scene[bi + 2];
        
        // Handle different types of objects
        if ((b !== 0xffff) && (c !== 0xffff)) {
          // Triangle -- get all three Z coordinates
          z1 = m_tvx[(3 * a) + 2];
          z2 = m_tvx[(3 * b) + 2];
          z3 = m_tvx[(3 * c) + 2];
          
          // Also get X Y coordinates of first vertex
          bi = 3 * a;
          x1 = m_tvx[bi];
          y1 = m_tvx[bi + 1];
          
          // Compute the vectors of the first edge (V1 -> V2) and also
          // of second edge (V1 -> V3)
          bi = 3 * b;
          e1x = m_tvx[bi    ] - x1;
          e1y = m_tvx[bi + 1] - y1;
          e1z = m_tvx[bi + 2] - z1;
          
          bi = 3 * c;
          e2x = m_tvx[bi    ] - x1;
          e2y = m_tvx[bi + 1] - y1;
          e2z = m_tvx[bi + 2] - z1;
          
          // Compute dot product of vector from camera to first vertex
          // of the triangle, and the normal at the first vertex
          p = (x1 * ((e1y * e2z) - (e1z * e2y))) +
              (y1 * ((e1z * e2x) - (e1x * e2z))) +
              (z1 * ((e1x * e2y) - (e1y * e2x)));
          
          // Check dot product first for backface culling
          if (p < 0) {
            // Not backface-culled, so next check whether all Z
            // coordinates are greater than or equal to near plane
            if ((z1 >= near) && (z2 >= near) && (z3 >= near)) {
              // Everything is before near plane, so cull
              m_paint[i] = 0xffffffff;
              
            } else {
              // Not culled by near plane, so next check whether all Z
              // coordinates are less than or equal to far plane
              if ((z1 <= far) && (z2 <= far) && (z3 <= far)) {
                // Everything is after far plane, so cull
                m_paint[i] = 0xffffffff;
                
              } else {
                // Triangle survived all culling, so we need to compute
                // the Z centroid next
                z = (z1 + z2 + z3) / 3.0;
                
                // Set to zero if not finite
                if (!isFinite(z)) {
                  z = 0.0;
                }
                
                // Clamp Z centroid to near/far plane range
                z = Math.min(Math.max(z, far), near);
                
                // Normalize centroid so that 1.0 is near plane and 0.0
                // is far plane
                z = (z - far) / extent;
                
                // Quantize to 16-bit integer space and clamp
                z = Math.floor(z * 65535.0);
                z = Math.min(Math.max(z, 0), 65535);
                
                // Write quantized Z and scene object index to paint
                // sorter
                m_paint[i] = (z << 16) | i;
              }
            }
            
          } else {
            // Backface culled
            m_paint[i] = 0xffffffff;
          }
        
        } else if ((b !== 0xffff) && (c === 0xffff)) {
          // Line -- get both Z coordinates
          z1 = m_tvx[(3 * a) + 2];
          z2 = m_tvx[(3 * b) + 2];
          
          // Check whether both Z coordinates are greater than or equal
          // to near plane
          if ((z1 >= near) && (z2 >= near)) {
            // Everything in front of near plane, so cull
            m_paint[i] = 0xffffffff;
            
          } else {
            // Not culled by near plane, so next check whether both Z
            // coordinates are less than or equal to far plane
            if ((z1 <= far) && (z2 <= far)) {
              // Everything behind far plane, so cull
              m_paint[i] = 0xffffffff;
              
            } else {
              // Line not culled, so we need to compute Z centroid next
              z = (z1 + z2) / 2.0;
              
              // Set to zero if not finite
              if (!isFinite(z)) {
                z = 0.0;
              }
              
              // Clamp Z centroid to near/far plane range
              z = Math.min(Math.max(z, far), near);
              
              // Normalize centroid so that 1.0 is near plane and 0.0
              // is far plane
              z = (z - far) / extent;
              
              // Quantize to 16-bit integer space and clamp
              z = Math.floor(z * 65535.0);
              z = Math.min(Math.max(z, 0), 65535);
              
              // Write quantized Z and scene object index to paint
              // sorter
              m_paint[i] = (z << 16) | i;
            }
          }
        
        } else {
          // Point or sphere -- get the origin Z coordinate
          z = m_tvx[(3 * a) + 2];
          
          // Check whether origin Z coordinate is greater than or equal
          // to near plane
          if (z >= near) {
            // Origin is in front of near plane, so cull
            m_paint[i] = 0xffffffff;
            
          } else {
            // Not culled by near plane, so next check whether it is
            // behind far plane
            if (z <= far) {
              // Point/sphere origin is behind far plane, so cull
              m_paint[i] = 0xffffffff;
              
            } else {
              // Not culled; clamp Z origin to near/far plane range
              z = Math.min(Math.max(z, far), near);
              
              // Normalize origin so that 1.0 is near plane and 0.0 is
              // far plane
              z = (z - far) / (extent);
              
              // Quantize to 16-bit integer space and clamp
              z = Math.floor(z * 65535.0);
              z = Math.min(Math.max(z, 0), 65535);
              
              // Write quantized Z and scene object index to paint
              // sorter
              m_paint[i] = (z << 16) | i;
            }
          }
        }
      }
      
      // Sort paint buffer in ascending numerical order, which puts the
      // scene elements from back to front by Z centroids, and the end
      // of the paint array is filled in with 0xffffffff
      m_paint.sort();
      
      // Now render all scene objects in order of centroids from back to
      // front; the variable k is used as a retry count for triangle
      // clipping
      k = 0;
      k_max = 0;
      j = m_paint.length;
      for(i = 0; i < j; i++) {
        
        // Get the current paint index value
        p = m_paint[i];
        
        // If current paint index is 0xffffffff then we are done
        if (p === 0xffffffff) {
          break;
        }
        
        // If we got here, the index of the scene object to render is in
        // the 16 least significant bits
        p = p & 0xffff;
        
        // Convert to base address in scene array and get scene object
        // values
        p = p * 5;
        a = m_scene[p];
        b = m_scene[p + 1];
        c = m_scene[p + 2];
        d = m_scene[p + 3];
        e = m_scene[p + 4];
        
        // Render specific type of object
        if ((b !== 0xffff) && (c !== 0xffff)) {
          // Triangle -- get Z coordinates first
          z1 = m_tvx[(3 * a) + 2];
          z2 = m_tvx[(3 * b) + 2];
          z3 = m_tvx[(3 * c) + 2];
          
          // Check whether all are within extent
          if ((z1 <= near) && (z2 <= near) && (z3 <= near) &&
              (z1 >= far) && (z2 >= far) && (z3 >= far)) {
            // No clipping is needed, so get the coordinates from the
            // projected vertices
            bi = (3 * a);
            x1 = m_pvx[bi];
            y1 = m_pvx[bi + 1];
            
            bi = (3 * b);
            x2 = m_pvx[bi];
            y2 = m_pvx[bi + 1];
            
            bi = (3 * c);
            x3 = m_pvx[bi];
            y3 = m_pvx[bi + 1];
            
          } else {
            // Clipping needed, and clipping may furthermore generate
            // multiple triangles from one, so we may need to process
            // the same triangle multiple times to render a different
            // clipped sub-triangle each time; check k, which is the
            // counter that keeps track of how many times this clipped
            // triangle has been retried
            if (k === 0) {
              // k is zero, which means this is the first time we are
              // handling this clipped triangle; begin by setting k_max
              // to one and k to one
              k_max = 1;
              k = 1;
              
              // If exactly one Z coordinate is beyond the far plane,
              // this will require two sub-triangles, so multiply k_max
              // by two in that case
              p = 0;
              if (z1 < far) {
                p++;
              }
              if (z2 < far) {
                p++;
              }
              if (z3 < far) {
                p++;
              }
              if (p === 1) {
                k_max = k_max * 2;
              }
              
              // If exactly one Z coordinate is before the near plane,
              // this will require two sub-triangles, so multiply k_max
              // by two in that case
              p = 0;
              if (z1 > near) {
                p++;
              }
              if (z2 > near) {
                p++;
              }
              if (z3 > near) {
                p++;
              }
              if (p === 1) {
                k_max = k_max * 2;
              }
              
              // We now have k_max set to the total number of
              // subtriangles we will need to render for clipping, which
              // may be either 1, 2, or 4, and we have k set to 1 so
              // that the next time around we will render the first
              // subtriangle; decrement the shape index so that we
              // process this triangle again and restart the loop
              i--;
              continue;
              
            } else if (k > k_max) {
              // k has exceeded total number of subtriangles, so there
              // is nothing left to render for this shape; reset k and
              // k_max to zero and restart the loop to process the next
              // shape
              k_max = 0;
              k = 0;
              continue;
              
            } else {
              // k is in range [1, k_max] so we are now rendering one
              // of the subtriangles for this clipped triangle; get the
              // rest of the camera coordinates
              bi = (3 * a);
              x1 = m_tvx[bi];
              y1 = m_tvx[bi + 1];
              
              bi = (3 * b);
              x2 = m_tvx[bi];
              y2 = m_tvx[bi + 1];
              
              bi = (3 * c);
              x3 = m_tvx[bi];
              y3 = m_tvx[bi + 1];
              
              // Begin by doing a bubble sort to sort the vertices in
              // descending Z coordinate order
              if (z1 < z2) {
                p = x1;
                x1 = x2;
                x2 = p;
                
                p = y1;
                y1 = y2;
                y2 = p;
                
                p = z1;
                z1 = z2;
                z2 = p;
              }
              
              if (z2 < z3) {
                p = x2;
                x2 = x3;
                x3 = p;
                
                p = y2;
                y2 = y3;
                y3 = p;
                
                p = z2;
                z2 = z3;
                z3 = p;
              }
              
              if (z1 < z2) {
                p = x1;
                x1 = x2;
                x2 = p;
                
                p = y1;
                y1 = y2;
                y2 = p;
                
                p = z1;
                z1 = z2;
                z2 = p;
              }
              
              // Handle near plane clipping, if necessary
              if ((z1 > near) && (z2 > near)) {
                // The first two vertices are both before the near
                // clipping plane, so we just need to adjust those two
                // vertices so that they are on the near clipping plane
                // while preserving the edge directions 1-3 and 2-3
                t1 = (near - z3) / (z1 - z3);
                t2 = (near - z3) / (z2 - z3);
                
                x1 = x3 + (t1 * (x1 - x3));
                y1 = y3 + (t1 * (y1 - y3));
                z1 = near;
                
                x2 = x3 + (t2 * (x2 - x3));
                y2 = y3 + (t2 * (y2 - y3));
                z2 = near;
                
              } else if (z1 > near) {
                // Only the first vertex is before the near clipping
                // plane, so we need two different subtriangles; when
                // k_max is 4, we will clip first subtriangle on k=1,2
                // and second subtriangle on k=3,4; when k_max is 2, we
                // will clip first subtriangle on k=1 and second
                // subtriangle on k=2; begin by storing original first
                // vertex in (x0,y0,z0)
                x0 = x1;
                y0 = y1;
                z0 = z1;
                
                // Adjust first vertex so that it is on edge 1->2 at the
                // intersection with the near plane
                t2 = (near - z2) / (z0 - z2);
                x1 = x2 + (t2 * (x0 - x2));
                y1 = y2 + (t2 * (y0 - y2));
                z1 = near;
                
                // If this is second subtriangle, adjust second vertex
                // so that it is on edge 1->3 at the intersection with
                // the near plane
                if (k > k_max / 2) {
                  t3 = (near - z3) / (z0 - z3);
                  x2 = x3 + (t3 * (x0 - x3));
                  y2 = y3 + (t3 * (y0 - y3));
                  z2 = near;
                }
              }
              
              // Handle far plane clipping, if necessary
              if ((z2 < far) && (z3 < far)) {
                // The second two vertices are both after the far
                // clipping plane, so we just need to adjust those two
                // vertices so that they are on the far clipping plane
                // while preserving the edge directions 1-2 and 1-3
                t2 = (far - z2) / (z1 - z2);
                t3 = (far - z3) / (z1 - z3);
                
                x2 = x2 + (t2 * (x1 - x2));
                y2 = y2 + (t2 * (y1 - y2));
                z2 = far;
                
                x3 = x3 + (t3 * (x1 - x3));
                y3 = y3 + (t3 * (y1 - y3));
                z3 = far;
                
              } else if (z3 < far) {
                // Only the third vertex is after the far clipping
                // plane, so we need two different subtriangles; when
                // k_max is 4, we will clip first subtriangle on k=1,3
                // and second subtriangle on k=2,4; when k_max is 2, we
                // will clip first subtriangle on k=1 and second
                // subtriangle on k=2; begin by storing original third
                // vertex in (x0,y0,z0)
                x0 = x3;
                y0 = y3;
                z0 = z3;
                
                // Adjust third vertex so that it is on edge 1->3 at the
                // intersection with the far plane
                t1 = (far - z0) / (z1 - z0);
                x3 = x0 + (t1 * (x1 - x0));
                y3 = y0 + (t1 * (y1 - y0));
                y3 = far;
                
                // If this is second subtriangle, adjust first vertex so
                // that it is on edge 2->3 at the intersection with the
                // far plane
                if ((k % 2) === 0) {
                  t2 = (far - z0) / (z2 - z0);
                  x1 = x0 + (t2 * (x2 - x0));
                  y1 = y0 + (t2 * (y2 - y0));
                  z1 = far;
                }
              }
              
              // Increment k so that next subtriangle will be processed
              // next time around and decrement shape index so we will
              // process the same triangle shape again next loop
              k++;
              i--;
            }
            
            // If we got here, then project the vertices of the clipped
            // subtriangle into screen space
            p = new Array(3);
            
            p[0] = x1;
            p[1] = y1;
            p[2] = z1;
            
            mtxProj.process(p);
            
            x1 = p[0];
            y1 = p[1];
            
            p[0] = x2;
            p[1] = y2;
            p[2] = z2;
            
            mtxProj.process(p);
            
            x2 = p[0];
            y2 = p[1];
            
            p[0] = x3;
            p[1] = y3;
            p[2] = z3;
            
            mtxProj.process(p);
            
            x3 = p[0];
            y3 = p[1];
          }
          
          // Draw triangle
          drawTri(rc, x1, y1, x2, y2, x3, y3, d, e);
        
        } else if ((b !== 0xffff) && (c === 0xffff)) {
          // Line -- get Z coordinates first
          z1 = m_tvx[(3 * a) + 2];
          z2 = m_tvx[(3 * b) + 2];
          
          // Check whether both are within extent
          if ((z1 <= near) && (z2 <= near) &&
              (z1 >= far) && (z2 >= far)) {
            // No clipping is needed, so get the coordinates from the
            // projected vertices
            x1 = m_pvx[(3 * a)];
            x2 = m_pvx[(3 * b)];
            
            y1 = m_pvx[(3 * a) + 1];
            y2 = m_pvx[(3 * b) + 1];
            
          } else {
            // At least one coordinate is outside extent; since we would
            // have culled the line earlier if both coordinates were
            // outside of extent, we know exactly one coordinate in
            // extent and one is out; begin by getting camera X and Y
            // coordinates
            x1 = m_tvx[(3 * a)];
            x2 = m_tvx[(3 * b)];
            
            y1 = m_tvx[(3 * a) + 1];
            y2 = m_tvx[(3 * b) + 1];
            
            // Flip coordinates if necessary so that z1 greater than z2
            if (!(z1 > z2)) {
              p = x1;
              x1 = x2;
              x2 = p;
              
              p = y1;
              y1 = y2;
              y2 = p;
              
              p = z1;
              z1 = z2;
              z2 = p;
            }
            
            // If the first Z coordinate is in front of the near plane,
            // then compute the t1 value along the line at which point
            // the line crosses the near plane; else, set t1 to zero so
            // that the whole start of the line is rendered
            if (z1 > near) {
              t1 = (near - z1) / (z2 - z1);
            } else {
              t1 = 0.0;
            }
            
            // If the second Z coordinate is behind the far plane, then
            // compute the t2 value along the line at which point the
            // line crosses the far plane; else, set t2 to 1.0 so that
            // the whole end of the line is rendered
            if (z2 < far) {
              t2 = (far - z1) / (z2 - z1);
            } else {
              t2 = 1.0;
            }
            
            // Recompute the endpoints of the line so that the clipped
            // line lies within the extent between the near and far
            // planes
            e1x = x1 + ((x2 - x1) * t1);
            e1y = y1 + ((y2 - y1) * t1);
            e1z = z1 + ((z2 - z1) * t1);
            
            e2x = x1 + ((x2 - x1) * t2);
            e2y = y1 + ((y2 - y1) * t2);
            e2z = z1 + ((z2 - z1) * t2);
            
            // Project the new endpoints so they are in screen space
            p = new Array(3);
            
            p[0] = e1x;
            p[1] = e1y;
            p[2] = e1z;
            
            mtxProj.process(p);
            
            x1 = p[0];
            y1 = p[1];
            
            p[0] = e2x;
            p[1] = e2y;
            p[2] = e2z;
            
            mtxProj.process(p);
            
            x2 = p[0];
            y2 = p[1];
          }
          
          // Draw the line
          drawLine(rc, x1, y1, x2, y2, e);
          
        } else if ((b === 0xffff) && (c !== 0xffff)) {
          // Sphere -- begin by getting the radius in world/camera space
          // and the Z coordinate of origin in camera space
          bi = a * 3;
          r  = m_rad[c];
          z  = m_tvx[bi + 2];
          
          // Project the radius and scale so that it is in projected
          // screen space
          r = (r / (proj_d - z)) * rad_mul;
          
          // Get projected X and Y
          x = m_pvx[bi];
          y = m_pvx[bi + 1];
          
          // Only proceed if projected radius is finite and greater than
          // zero
          if (isFinite(r) && (r > 0.0)) {
            
            // Draw the sphere
            drawSphere(rc, x, y, r, d, e);
          }
        
        } else {
          // Point -- draw to screen
          bi = a * 3;
          drawPoint(rc, m_pvx[bi], m_pvx[bi + 1], e);
        }
      }
    }
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
   * Get the current background color.
   * 
   * This returns an array of three values R G B each in range [0, 255].
   * 
   * Return:
   * 
   *   a new array copy of the current background color
   */
  function getBGColor() {
    
    var result = [];
    
    result.push(m_bgcolor[0]);
    result.push(m_bgcolor[1]);
    result.push(m_bgcolor[2]);
    
    return result;
  }
  
  /*
   * Set the background color.
   * 
   * The given values are integer R G B color channel values, each of
   * which must be in range [0, 255].
   * 
   * Parameters:
   * 
   *   r : integer - the red channel
   * 
   *   g : integer - the green channel
   * 
   *   b : integer - the blue channel
   */
  function setBGColor(r, g, b) {
    
    var func_name = "setBGColor";
    
    // Check parameters and convert to integer
    if ((typeof r !== "number") ||
        (typeof g !== "number") ||
        (typeof b !== "number")) {
      fault(func_name, 100);
    }
    
    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);
    
    if ((!isFinite(r)) ||
        (!isFinite(g)) ||
        (!isFinite(b))) {
      fault(func_name, 110);
    }
    
    if (!((r >= 0) && (r <= 255))) {
      fault(func_name, 120);
    }
    if (!((g >= 0) && (g <= 255))) {
      fault(func_name, 121);
    }
    if (!((b >= 0) && (b <= 255))) {
      fault(func_name, 122);
    }
    
    // Update projection
    m_bgcolor[0] = r;
    m_bgcolor[1] = g;
    m_bgcolor[2] = b;
  }
  
  /*
   * Get the current projection.
   * 
   * This returns an array of three values [fov, near, far] where fov
   * is the normalized field-of-view angle, near is the near plane Z and
   * far is the far plane Z.  See the documentation of m_proj for
   * further information. 
   * 
   * Return:
   * 
   *   a new array copy of the current projection
   */
  function getProjection() {
    
    var result = [];
    
    result.push(m_proj[0]);
    result.push(m_proj[1]);
    result.push(m_proj[2]);
    
    return result;
  }
  
  /*
   * Set the projection.
   * 
   * fov is the normalized field-of-view angle.  near and far are the Z
   * locations of the near and far planes.  See the documentation of
   * m_proj for further information.
   * 
   * Parameters:
   * 
   *   fov : number - the field of view
   * 
   *   near : number - the near plane Z
   * 
   *   far : number - the far plane Z
   */
  function setProjection(fov, near, far) {
    
    var func_name = "setProjection";
    
    // Check parameters
    if ((typeof fov !== "number") ||
        (typeof near !== "number") ||
        (typeof far !== "number")) {
      fault(func_name, 100);
    }
    
    if ((!isFinite(fov)) ||
        (!isFinite(near)) ||
        (!isFinite(far))) {
      fault(func_name, 110);
    }
    
    if (!((fov > 0.0) && (fov < 1.0))) {
      fault(func_name, 120);
    }
    if (!(near < 1 / Math.tan(fov * Math.PI / 2))) {
      fault(func_name, 130);
    }
    if (!(far < near)) {
      fault(func_name, 140);
    }
    
    // Update projection
    m_proj[0] = fov;
    m_proj[1] = near;
    m_proj[2] = far;
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
      m_pvx = new Float64Array(vtx.length);
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
    "getBGColor": getBGColor,
    "setBGColor": setBGColor,
    "getProjection": getProjection,
    "setProjection": setProjection,
    "getCamera": getCamera,
    "setCamera": setCamera,
    "loadError": loadError,
    "loadScene": loadScene,
    "loadDefaultScene": loadDefaultScene
  };
  
}());
