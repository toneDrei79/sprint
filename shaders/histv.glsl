uniform sampler2D tex;
varying vec3 rgb;
varying vec3 col;
uniform vec3 color;

void main() {
    // vec2 p = vec2(gl_Position.x/1000., gl_Position.y/1000.);
    // r = texture2D ( tex, p ).r;
    // r = texture2D ( tex, uv.xy ).r;
    // col = texture2D ( tex, uv.xy ).rgb;
    // r = texture2D ( tex, position.xy ).r;
    vec3 rgb = texture2D ( tex, position.xy ).rgb;




    // ivec2 texSize = textureSize(tex, 0);
    // ivec2 texelCoord = ivec2(gl_VertexID / texSize.x, gl_VertexID % texSize.x);

    // vec3 texColor = texelFetch(tex, texelCoord, 0).rgb;
    float pos = dot(color, rgb);
    // vec3 pos = rgb;



    // gl_Position = projectionMatrix * modelViewMatrix * vec4 (r, position.y, 0., 1.0);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4 (position, 1.0);
    // gl_Position = vec4(2.*r-1., 0., 0., 1.0);
    // gl_Position = vec4(2.*pos.r - 1., 0., 0., 1.0);
    gl_Position = vec4(2.*pos - 1., 0., 0., 1.0);
    // gl_Position = modelViewMatrix * vec4(r*1.5, 0.5, 0., 1.0);
    // gl_Position = projectionMatrix * modelViewMatrix * vec4(r, position.y/500.0, 0., 1.0);

    gl_PointSize = 1.0;
    // gl_PointSize = 2.0;
}