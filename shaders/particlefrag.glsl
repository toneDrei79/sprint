varying vec3 color;

void main() {
    float l = length(gl_PointCoord - vec2(.5, .5));
    // if (l > 0.475) discard;
    gl_FragColor.rgb = color;
    // gl_FragColor.a = (0.75-l) / 10.0;
    gl_FragColor.a = 1.0;
}