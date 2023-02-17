uniform float r[256];
uniform float g[256];
uniform float b[256];
uniform sampler2D tex;
flat in int x;
varying float y;

void main() {
    // if (gl_FragCoord.y > r[int(gl_FragCoord.x)]) discard;

    float R = 0.0;
    float G = 0.0;
    float B = 0.0;
    if (y > r[x] && y > g[x] && y > b[x]) discard;
    if (y < r[x]) R = 1.0;
    if (y < g[x]) G = 1.0;
    if (y < b[x]) B = 1.0;

    vec4 color = vec4(R, G, B, 1.0);
    gl_FragColor = color;    
}