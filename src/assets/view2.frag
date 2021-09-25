#version 300 es
precision highp float;

#define PI 3.14159

uniform sampler2D text;
uniform float time;
uniform float nRow;

in vec2 vTexCoord;
in vec2 vUv;
in float vProgress;
in float vBefore;
in vec4 vColor;
in float vAnime;

out vec4 outColor;

vec2 rotate(vec2 coord, float angle) {
  return mat2(cos(angle),-sin(angle),
              sin(angle),cos(angle)) * coord;
}

float rate(float s, float e, float x) {
    return (x - s) / (e - s);
}
float rate(float s, float e, float bottom, float top, float x) {
    return bottom + (x - s) / (e - s) * (top - bottom);
}
float easeInOutCubic(float t) {
    if ((t *= 2.0) < 1.0) {
        return 0.5 * t * t * t;
    } else {
        return 0.5 * ((t -= 2.0) * t * t + 2.0);
    }
}

// ref https://qiita.com/gam0022/items/f3b7a3e9821a67a5b0f3
float anime1() {
    vec2 uv = vTexCoord;
    uv.y = clamp(uv.y, .0, clamp(vBefore, 0., 1.));
    float d = texture(text, uv).y;  
    return step(.01, clamp(d, 0.0, 1.0)); 
}
// 細くなる
float anime2(float d) {
    return step(rate(0., 1., 0.08, .01, clamp(vBefore, 0., 1.)), d);
}
// outline
float anime3(float d) {
    return step(0.01, d) * step(d, rate(0., 1., 0.08, .8, easeInOutCubic(clamp(vProgress, 0., 1.))));
}
// 渦巻
float anime4() {
    float s = clamp(1. - vProgress, .0, 1.) ;
    vec2 uv = vUv;
    vec2 p0 =  (uv - .5);
    float ta0 = fract(atan(p0.y,p0.x)/(PI * 2.) +1.) * PI * 2.;
    float len = length(p0);
    s *= 10. * (1. - len);
    vec2  p1 = len * vec2(cos(ta0 + PI * s), sin(ta0 + PI * s));

    vec2 uv1 = vTexCoord;
    uv1 += (p1 - p0) / nRow;

    float d1 = texture(text, uv1).y;
    float b = step(vProgress, .3) * step(.5, length(p0));
    d1 = (1. - b) * d1;
    d1 *= step(0., vProgress); 
    return step(.01, clamp(d1, 0.0, 1.0)); 
}

// glitch https://taiga.hatenadiary.com/entry/2019/11/11/210000
float rnd(vec2 n){
    float a = 0.129898;
    float b = 0.78233;
    float c = 437.585453;
    float dt= dot(n ,vec2(a, b));
    float sn= mod(dt, 3.14);
    return fract(sin(sn) * c);
}
float anime5() {
    vec2 uv = vUv;
    float block = .1;
    float threshold = .08;
    float x = floor(uv.y / block) * block;
    float n = rnd(vec2(x, vProgress));
    float xstep = step(n, threshold);
    float strength = n / threshold;
    strength = strength * 2. - 1.;

    return texture(text, vTexCoord + vec2(xstep * strength, .0)).g; 
}
void main() {
    vec4 col = vColor;
    float d = texture(text, vTexCoord).y;
    
    float d1 = anime1();
    float d2 = anime2(d);
    float d3 = anime3(d);
    float d4 = anime4();
    float d5 = anime5();
    d = step(abs(vAnime), .1) * d +
        step(abs(vAnime - 1.), .1) * d1 +
        step(abs(vAnime - 2.), .1) * d2 +
        step(abs(vAnime - 3.), .1) * d3 +
        step(abs(vAnime - 4.), .1) * d4 +
        step(abs(vAnime - 5.), .1) * d5;
    d = step(0.01, d);
    if (d == .0) {
        discard;
    } else {
        outColor = vColor;
    }
}