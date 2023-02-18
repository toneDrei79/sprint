varying vec3 rgb;
varying vec3 col;
uniform vec3 color;

void main () {
    // vec4 color = vec4(1.0, 0., 0., 1.);
    // vec4 color = vec4(rgb, 1.0);
    // if (color.r == 1.0) gl_FragColor = vec4(1.0, 0., 0., 1.);
    // else if (color.g == 1.0) gl_FragColor = vec4(0., 1., 0., 1.);
    // else if (color.b == 1.0) gl_FragColor = vec4(0., 0., 1., 1.);
    // else gl_FragColor = vec4(0., 0., 0., 1.);
    gl_FragColor = vec4(color, 0.);
    // gl_FragColor = vec4(col, 1.0);
}