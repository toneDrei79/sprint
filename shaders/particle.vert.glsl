uniform sampler2D tex;
varying vec3 color;

void main() {
    color = texture2D ( tex, position.xy ).rgb;
    vec4 pos = modelViewMatrix * vec4(color-vec3(.5,.5,.5), 1.0);
    float size = 7.0;
    float variance = 5.0;
    gl_PointSize = size / (-pos.z*variance);
    // gl_PointSize = 30.;
    gl_Position = projectionMatrix * pos;
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(color-vec3(.5,.5,.5), 1.0);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}