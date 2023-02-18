uniform sampler2D hist;
flat out int x;
varying float y;
varying vec2 vUv;
varying vec2 p;
varying vec3 col;
flat out ivec2 texelCoord;

uniform float histmem[256];

void main() {
    ivec2 texSize = textureSize(hist, 0);



    // x = int(uv.x*255.0);
    x = gl_VertexID % (texSize.x+1);
    // if(texSize.x == 256) x = 0
    y = uv.y;
    vUv = uv;
    p = position.xy;
    col = texture2D ( hist, position.xy ).rgb;

    
    // texelCoord = ivec2(gl_VertexID % texSize.x, 0);
    texelCoord = ivec2(gl_VertexID % 256, 0);
    vec3 texColor = texelFetch(hist, texelCoord, 0).rgb;

    gl_Position = projectionMatrix * modelViewMatrix * vec4 (position.x, position.y, position.z, 1.0);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4 (position.x, texelCoord.y, position.z, 1.0);
}