#version 300 es
precision highp float;

#define INSIDE 32.
#define OUTSIDE 2.

uniform sampler2D img0;
uniform sampler2D img1;
uniform sampler2D img2;


in vec2 vTexCoord;

out vec4 outColor;

void main() {
    float origin = texture(img0, vTexCoord).r;
    float inside = texture(img1, vTexCoord).z;
    float outside = texture(img2, vTexCoord).z;

    float dist =  (clamp(inside / INSIDE, .0, 1.) - clamp(outside / OUTSIDE, .0, 1.)) ;

    outColor = vec4(origin, dist, inside ,outside);
}