#version 300 es
precision mediump float;

#define PI 3.14159

uniform float beat;

in vec2 vTexCoord;

out vec4 outColor;

float easeInSin(float x) {
    return 1. - cos((x * PI) * .5);
}

void main() {
    vec4 col = vec4(168. / 255., .0, 59. / 255., 1.);
    vec2 uv = vTexCoord;
    float b = clamp(easeInSin(beat), .6, 1.);
    float a = smoothstep(0.4 * b, 0.2 * b, length(uv) );
    if (a < 0.001) {
        discard;
    } else {
        outColor = vec4(col.rgb, a);
    }
}