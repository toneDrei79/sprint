uniform sampler2D tex;
uniform vec3 color;

void main() {
    vec3 rgb = texture2D ( tex, position.xy ).rgb;
    float pos = dot(color, rgb);
    // if (pos > 156./256.) {
    if (pos > 226./256.) {
        gl_Position = vec4(2.*pos - 1., 0., 0., 1.0);
        gl_PointSize = (1.-pos)*256.;
    }
    else{
        gl_Position = vec4(2.*pos - 1., 0., 0., 1.0);
        gl_PointSize = 10.0;
    }
}