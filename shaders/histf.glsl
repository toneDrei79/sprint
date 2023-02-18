varying float r;
varying vec3 col;

void main () {
    vec4 color = vec4(1., 0.0, 0.0, 0.0);
    // vec4 color = vec4(r, 0.0, 0.0, 1.0);
    gl_FragColor = color;
    // gl_FragColor = vec4(col, 1.0);
}