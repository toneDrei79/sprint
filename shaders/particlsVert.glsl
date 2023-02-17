uniform sampler2D tex;
uniform int mode;
varying vec3 color;


float f(float t) {
    if (t > 0.008856) return pow(t, 0.333);
    return (903.296*t + 16.) / 116.;
}

void main() {
    color = texture2D ( tex, position.xy ).rgb;

    vec3 ref = color;
    if (mode == 1) {
        float X = 0.4124*color.r + 0.3576*color.g + 0.1805*color.b;
        float Y = 0.2126*color.r + 0.7152*color.g + 0.0722*color.b;
        float Z = 0.0193*color.r + 0.1192*color.g + 0.9505*color.b;
        float x = X / (X+Y+Z);
        float y = Y / (Y+Y+Z);
        float z = 1.0 - x - y;
        X = Y/y * x;
        Z = Y/y * z;
        float scale;
        ref.x = x;
        ref.y = Y;
        ref.z = y;
    }
    else if (mode == 2) {
        float X = 0.4124*color.r + 0.3576*color.g + 0.1805*color.b;
        float Y = 0.2126*color.r + 0.7152*color.g + 0.0722*color.b;
        float Z = 0.0193*color.r + 0.1192*color.g + 0.9505*color.b;
        float L = 166.*f(Y) - 16.;
        float a = 500. * (f(X) - f(Y));
        float b = 200. * (f(Y) - f(Z));
        ref.x = a*1./128.;
        ref.y = L*0.01 - 0.5;
        ref.z = b*1./128.;

    }
    // vec4 pos = modelViewMatrix * vec4(color-vec3(.5,.5,.5), 1.0);
    // vec4 pos = modelViewMatrix * vec4(vec3(color.g, color.b, color.r)-vec3(.5,.5,.5), 1.0);
    vec4 pos = modelViewMatrix * vec4(vec3(ref)-vec3(.5,.5,.5), 1.0);
    float size = 7.0;
    float variance = 5.0;
    gl_PointSize = size / (-pos.z*variance);
    gl_Position = projectionMatrix * pos;
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(color-vec3(.5,.5,.5), 1.0);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}