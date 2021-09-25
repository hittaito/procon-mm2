#version 300 es
precision mediump float;

#define PI 3.14159

uniform float beat;

in vec4 vColor;
in vec2 vTexCoord;

out vec4 outColor;

float easeInSin(float x) {
    return 1. - cos((x * PI) * .5);
}

void main() {
    vec2 uv = vTexCoord - vec2(.5);
    float b = clamp(easeInSin(beat), .6, 1.);
    float a = smoothstep(0.4 * b, 0.2 * b, length(uv) );
    if (a < 0.001) {
        discard;
    } else {
        outColor = vec4(vColor.rgb, vColor.a * a);
    }
}