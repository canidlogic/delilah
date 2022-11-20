# Delilah Viewer

Delilah is a simple 3D scene viewer built entirely in client-side Javascript.  It can be run directly from HTML and JS files using the `file://` protocol, since it does not require a server.

3D scenes in Delilah support the following primitives:

- Point
- Line
- Sphere
- Triangle

Points can be rendered in different shapes, sizes, and colors.  Lines can be rendered with different widths and colors.  Spheres can optionally have their outlines stroked in one of the line styles, and they can either be filled with a color chosen on a per-sphere basis or be fully transparent.  Triangles can optionally have any combination of their edges stroked in one of the line styles, and they are always filled with a color chosen on a per-triangle basis.

The rendering engine uses a simple painter's algorithm with backface culling.  The 3D rendering is a pure Javascript engine without any external dependencies.  Rendering in the browser uses 2D canvas rendering.  WebGL is *not* used for rendering.

Delilah is especially useful for interactively figuring out the camera position, direction, and field of view given a simplified preview of a 3D scene.  The camera position, direction, and field of view determined by Delilah can then be used to configure a full-quality 3D render with a more sophisticated rendering system which might not support interactive exploring.

## Coordinate system

Delilah uses a *right-handed* coordinate system.  The X axis runs from left to right, with increasing X values moving rightward.  The Y axis runs from bottom to top, with increasing Y values moving upward.  The Z axis runs from back to front, with increasing Z values moving towards the front.

The *yaw* of the camera rotates the camera direction left or right on the XZ plane without changing the position of the camera.  Increasing yaw will rotate left, which is counter-clockwise around the Y axis.  Yaw is controlled with the left and right arrow keys.  The allowed range of values is [-360, 360] degrees.

The *pitch* of the camera rotates the camera direction up or down on the YZ plane without changing the position of the camera.  Increasing pitch will rotate up, which is counter-clockwise around the X axis.  Pitch is controlled with the up and down arrow keys.  The allowed range of values is [-90, 90] degrees.

The *roll* of the camera rotates the camera around the Z axis without changing the position of the camera.  When roll is zero, the camera is perfectly level with the XZ plane.  Increasing roll will tilt the camera counter-clockwise on its side.  No key controls directly affect roll.  However, roll can manually be changed with the camera position control boxes.  The allowed range of values is [-360, 360] degrees.

In order to transform the camera from the origin to its selected position, the following is the order of operations:

1. Roll around Z axis
2. Pitch around X axis
3. Yaw around Y axis
4. Translate XYZ

## Projection

Delilah always uses a perspective projection based on a pinhole camera model.  The *field of view* is the angle between the bottom of the canvas view and the top of the canvas view.  High field of views result in wide-angle perspectives that have extreme perspective effects, similar to a fisheye lens.  Low field of views result in narrow perspectives that zoom in and have minimal perspective effects, similar to a telephoto lens.  Delilah supports field of views in range [1, 179] degrees.

The *near* and *far* planes determine the depth limits of the scene.  Anything in front of the near plane will be clipped, and anything behind the far plane will be clipped.  Due to the right-handed coordinate system, near and far plane locations will almost always be zero or negative, since positive Z values would be behind the camera.  The far plane Z value must be less than the near plane Z value (far plane is always further away than near plane).

The *near plane limit* is computed automatically from the field of view value.  The near plane must always be less than the near plane limit.  However, since the near plane limit is always greater than zero and there's rarely a reason for the near plane to be greater than zero, the near plane limit is rarely relevant.

Having a long distance between the near and far planes is advantageous because the a long distance between the planes will ensure the whole scene is displayed.  However, the painter's algorithm used for rendering quantizes Z distances from the camera to a fixed range of 65,536 values spaced evenly between the near and far planes.  If the near and far planes are far apart, Z quantization is more likely to result in rounding errors that cause the painter's algorithm to draw the primitives in the wrong order.

The optimal setting for near and far planes, therefore, is to have them as close as possible while still keeping everything in the scene visible.

## User interface

A default scene is loaded when the application is first started.  You can load a custom scene by choosing a local JSON file to load in the *scene file* section.

The canvas recognizes keyboard presses, or you can use the virtual keyboard buttons provided below the canvas.  You may need to click the canvas before it picks up the key presses.  WASD moves around on the current XZ plane, with W being forward, A being left, S being back, and D being right, all relative to the current camera direction on the XZ plane.  Shift moves down the Y axis and Spacebar moves up the Y axis.  The arrow keys adjust the direction the camera is facing, with left and right changing the yaw while up and down change the pitch.  The *speed* controls underneath the virtual keys control how much each keypress changes its parameter.

You can change the size of the canvas using the *canvas size* options.  The larger the canvas, the longer it may take to render.

The *camera position* controls show the current XYZ coordinates of the camera and the rotations determining the camera's direction.  These controls are updated automatically as you move around in the scene.  You can also manually enter new values and use the *Set* button to update the display.  At any time, you can reset the controls to match the current canvas view with the *Get* button.  The only way to change the roll of the camera is by manually setting a new value with these controls.

The *projection* controls determine the field of view angle and the near and far plane distances, as explained earlier.  You can manually change these values and use the *Set* button to update the view.  At any time, you can reset the controls to match the current canvas view with the *Get* button.  There should never be a need to manually edit the near plane limit field, since this is automatically computed from the field of view and merely tells you the maximum possible value for the near plane.

Finally, the *background color* control determines the solid color to fill the canvas with before rendering.  This is represented as a base-16 string of exactly six digits, with the first two digits selecting the red channel value, the second two digits selecting the green channel value, and the last two digits selecting the blue channel value.  Use the *Set* button to update the background color and *Get* to reset the control to the current background color.

## Scene file format

When the Delilah viewer is started up, a default scene file is loaded.  To load a custom scene file, use the *scene file* control to choose a file in the local file system.  This section explains the format of the scene file.

Scene files are JSON data files.  The top-level entity in the file must be a JSON object.  The following subsections describe the properties of this top-level object that may be present.

### Hicolor encoding

Multiple places in this scene file format description have a property value of the *Hicolor* type.  A Hicolor value is always an integer in range [0, 32767].  The binary value of this integer encodes RGB fields as follows:

    MSB ----------- LSB
    0rrr rrgg gggb bbbb

Each color channel is a 5-bit value in range [0, 31].  This is equivalent to 15-bit Hicolor.  (The diagram above shows 16 bits with the 16th bit always set to zero.)

### Vertex array

All scene files should have a `vertex` property on their top-level object.  This property value should be an array of floating-point values.  The length of this array must be a multiple of three.  Each three floating-point values defines a vertex, with coordinates in XYZ order.  The first three floating-point values define vertex index zero, the second three floating-point values define vertex index one, and so forth.

There must be at least one vertex and at most 65,535 vertices defined in the vertex array.

Vertices are not directly rendered.  Instead, they will be referenced from the scene array.

### Radius array

Scene files that include any sphere primitives should have a `radius` property on their top-level object.  The `radius` property is not required if there are no spheres in the scene.

The `radius` property value is an array of floating-point values.  Each of these should be greater than zero.  The first element is radius index zero, the second element is radius index one, and so forth.  There may be at most 65,535 elements in the array.  The array may also be empty.

Radius elements are not directly rendered.  Instead, they will be referenced from sphere objects within the scene array.

### Point styles array

Scene files that include any point primitives should have a `pstyle` property on their top-level object.  The `pstyle` property is not required if there are no points in the scene.

The `pstyle` property value is an array of objects.  Each object defines a point style, which is used to define the way in which a point primitive is rendered.  The first object is point style index zero, the second object is point style index one, and so forth.  There may be at most 65,535 point styles in the array.  The array may also be empty.

All point style objects have a `shape` property that has a value that is a one-letter string.  The letter in this string determines the kind of shape:

- `c` = Circle
- `s` = Square
- `m` = Diamond
- `u` = Triangle, pointing upwards
- `d` = Triangle, pointing downwards
- `l` = Triangle, pointing left
- `r` = Triangle, pointing right
- `p` = Plus sign `+`
- `x` = X

All point style objects have a `size` property that is a floating-point value greater than zero.  This determines the length of each edge around the bounding box.  In other words, this is the display size of the point object.  Point objects are always displayed at this side regardless of how far away they are from the camera.  (If you want a circle that properly changes in size depending on how far away it is from the camera, use a sphere primitive instead of a point primitive with a circle shape.)

All point style objects have a `stroke` property that is either zero or a floating-point value greater than zero.  If the `stroke` property is zero, then the outline of the point shape is not stroked.  Otherwise, the point shape is stroked.

All point style objects, _except_ those with a plus sign or X shape, have a `fill` property that determines how to fill the interior of the shape.  (Neither the plus sign nor the X shape have any interior.)  The `fill` property value is a Hicolor integer value, or the special value 65535, which means the interior of the shape should be transparent.

All point style objects that have a `stroke` property that is greater than zero also have an `ink` property.  The `ink` property value is a Hicolor integer value, which determines the color that is used to stroke the outline of the shape.

### Line styles array

Scene files that include any line primitives, or any sphere or triangle primitives that have stroked borders, should have an `lstyle` property on their top-level object.  The `lstyle` property is not required if there are no referenced line styles in the scene.

The `lstyle` property value is an array of objects.  Each object defines a line style, which is used to define the way in which edges and borders are rendered.  The first object is line style index zero, the second object is line style index one, and so forth.  There may be at most 65,535 line styles in the array.  The array may also be empty.

Triangle edges are only able to reference the first 31 line styles (indices 0-30).  Line and sphere primitives are able to reference all line styles.

Line styles have `width` and `color` properties.  The `width` property is a floating-point value that is greater than zero.  It determines the width of the rendered line.  This width is used regardless of the distance from the camera to the line.  The `color` property is a Hicolor integer value which determines the color of the line.

### Scene array

All scene files should have a `scene` property on their top-level object.  The value of this property is an array of integer values.  The length of the array must be a multiple of five, and each sequence of five integers represents a single scene object.  There must be at least one scene object and at most 65,535 scene objects.  Each integer in the array must be in range [0, 65535].

Each scene object is therefore a sequence of exactly five integers, each in range [0, 65535].  The five integers have the following meanings:

1. Index of first vertex
2. Index of second vertex, or 65535 if point or sphere
3. Index of third vertex or radius, or 65535 if point or line
4. Fill value (see subsection below)
5. Style (see subsection below)

To determine the kind of primitive, examine the second and third values.  The specific combination of special value of 65535 with any other values determines the primitive:

- **Triangle:** neither 2nd nor 3rd is 65535
- **Sphere:** 2nd is 65535, 3rd is not 65535
- **Line:** 2nd is not 65535, 3rd is 65535
- **Point:** 2nd and 3rd are both 65535

The first three values, when they are not 65535, are indices into the vertex array.  However, for the sphere primitive, the 3rd value is an index into the radius array.

#### Vertex interpretations

For a triangle, the first three values determine the locations of the three vertices.  **The order of triangle vertices is important!**  Triangles are only visible from the side where the vertices go around the triangle in counter-clockwise order.  Triangles are invisible from the side where the vertices go around the triangle in clockwise order.  Triangles will not display correctly if you put their vertices in the wrong order!

For a sphere, the first value determines the vertex location of the center of the sphere.  The third value determines the radius of the sphere.

For a line, the first two values determine the vertex endpoints of the line in 3D space.  The order of line vertices is not important.

For a point, the first value determines the vertex location of the point.

#### Fill value

The fourth value (the fill value) is only relevant for triangles and spheres.  For these primitives, the fill value is a Hicolor integer value that determines the solid color to fill the triangle.  For spheres only, 65535 is allowed as a special value indicating that the sphere is transparent and should not be filled.  (Transparent triangles can be represented as line primitives.)  Triangles are only filled from the side where their vertices are in counter-clockwise order.  From the other side, triangles are fully transparent and invisible.

#### Style value

The fifth value (the style value) depends on the specific type of primitive.

For a triangle, the style value encodes three 5-bit selectors for line styles in the line style array:

    MSB ----------- LSB
    0iii iijj jjjk kkkk

Selector `i` is for the triangle edge between first and second vertices.  Selector `j` is for the triangle edge between second and third vertices.  Selector `k` is for the triangle edge between third and first vertices.

Selectors that have a value of zero mean that the corresponding edge is not rendered as a line.  Therefore, setting the triangle style value to zero means that none of the edges will be rendered.

Selectors that have a value greater than zero select the style in the line style array that has an index *one less* than the selector value.  Selectors are therefore only able to select line styles 0-30.

For a sphere, the style is an index into the line style array indicating how to stroke the circular outline of the sphere.  The special value 65535 is allowed, indicating that the circular outline should not be stroked.

For a line, the style is an index into the line style array indicating how to stroke the line.

For a point, the style is an index into the point style array indicating how to render the point.
