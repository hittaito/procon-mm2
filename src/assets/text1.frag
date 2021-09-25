#version 300 es
precision highp float;

#define SQRT2 1.41421356237
#define CH a

uniform sampler2D img;

in vec2 vTexCoord;

layout(location = 0) out vec4 outColor1;
layout(location = 1) out vec4 outColor2;

vec2 ComputeEdgeGradients(ivec2 pos) {
    float g = 
        - texelFetch(img, pos + ivec2(-1,-1), 0).CH
        - texelFetch(img, pos + ivec2(-1, 1), 0).CH
        + texelFetch(img, pos + ivec2( 1,-1), 0).CH
        + texelFetch(img, pos + ivec2( 1, 1), 0).CH;

    return normalize(vec2(
        g + (texelFetch(img, pos + ivec2(1, 0), 0).CH - texelFetch(img, pos + ivec2(-1, 0), 0).CH) * SQRT2,
        g + (texelFetch(img, pos + ivec2(0, 1), 0).CH - texelFetch(img, pos + ivec2(0, -1), 0).CH) * SQRT2
    ));
}
vec2 sobel(ivec2 pos) {
    float l1 = texelFetch(img, pos + ivec2(-1, 1), 0).CH;
    float l2 = texelFetch(img, pos + ivec2(-1, 0), 0).CH;
    float l3 = texelFetch(img, pos + ivec2(-1, -1), 0).CH;

    float t = texelFetch(img, pos + ivec2(0, 1), 0).CH;
    float b = texelFetch(img, pos + ivec2(0, -1), 0).CH;

    float r1 = texelFetch(img, pos + ivec2(1, 1), 0).CH;
    float r2 = texelFetch(img, pos + ivec2(1, 0), 0).CH;
    float r3 = texelFetch(img, pos + ivec2(1, -1), 0).CH;

    return vec2(1.);   
}
float ApproximateEdgeDelta(vec2 grad, float a) 
{
    if (grad.x == 0.0 || grad.y == 0.0) {
        return 0.5 - a;
    }
    grad = abs(normalize(grad));
    float gmax = max(grad.x, grad.y);
    float gmin = min(grad.x, grad.y);

    float a1 = 0.5 * gmin / gmax;
    if (a < a1) {
        return 0.5 * (gmax + gmin) - sqrt(2.0 * gmax * gmin * a);
    }
    if (a < (1.0 - a1)) {
        return (0.5 - a) * gmax;
    }
    return -0.5 * (gmax + gmin) + sqrt(2.0 * gmax * gmin * (1.0 - a));
}
float InitializeDistance(vec2 grad, float alpha)
{
    if (alpha <= 0.) {
        return 10000.0;
    } else if (alpha < 1.0) {
        return ApproximateEdgeDelta(grad, alpha);
    } else {
        return 0.0;
    }
}


void main() {
    ivec2 pos = ivec2(vTexCoord * vec2(textureSize(img, 0)));
    vec2 grad = ComputeEdgeGradients(pos);
    float alpha = texelFetch(img, pos, 0).CH;

    outColor1.xy = vec2(0.0);
    outColor1.z = InitializeDistance(-grad, 1.0 - alpha);
    outColor1.a = 1.0 - alpha;

    outColor2.xy = vec2(0.0);
    outColor2.z = InitializeDistance(grad, alpha);
    outColor2.a = alpha;
}