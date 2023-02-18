uniform sampler2D hist;
flat in int x;
varying float y;
varying vec2 vUv;
varying vec2 p;
varying vec3 col;
flat in ivec2 texelCoord;

uniform float histmem[256];

void main() {
    vec4 color = vec4(1.0, 0.0, 0.0, 1.0);

    // vec2 n = vec2(vUv.x, 0.);

    // vec3 dat = texture2D ( hist, xy ).rgb;
    // vec3 dat = texture2D ( hist, vec2(x, 0.0) ).rgb;
    // vec3 dat = texture2D ( hist, n ).rgb;
    // vec3 dat = texture2D ( hist, p ).rgb;

    // vec3 dat = texture2D(hist, vec2(3., 1.)).rgb;
    vec3 dat = texelFetch(hist, ivec2(x, 0), 0).rgb;
    // dat /= 20000.;

    vec3 counts = texture(hist, vUv).rgb;
    // vec3 max_count = vec3(texture(max_val, uv).r);

    vec3 relative = counts / 10000.;

    if (y > histmem[x]) discard;

    // if (x % 2 == 0) discard;
    // if (dat.r == 0.0) discard;
    // vec3 dat = texture2D ( hist, vUv ).rgb;
    // gl_FragColor = color;
    // gl_FragColor = vec4(relative, 1.0);
    // gl_FragColor = vec4(col/20000., 1.0);


    // gl_FragColor = vec4(histmem[x]/10000., 0., 0., 1.0);
    gl_FragColor = vec4(1., 0., 0., 1.0);


}