uniform float r[256];
uniform float g[256];
uniform float b[256];
uniform sampler2D tex;
uniform int w;
uniform int h;

flat out int x;
varying float y;

void main() {
    // for (int j=0; j<h; j++) {
    //     for (int i=0; i<w; i++) {
    //         float xy[2];
    //         xy[0] = float(i) / float(w);
    //         xy[1] = float(j) / float(h);
    //     }
    // }


    x = int(uv.x*255.0);
    y = uv.y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4 (position.x, position.y, position.z, 1.0);
}