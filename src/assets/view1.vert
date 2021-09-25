#version 300 es
precision highp float;

#define PI 3.14159

uniform float time;
uniform vec2 mouse;
uniform float aspect;
uniform float mode;

layout(location = 0) in vec3 position;
layout(location = 1) in vec4 indexes; // C CinP CinB BinP
layout(location = 2) in vec3 sTime; // C P B
layout(location = 3) in vec3 eTime; // C P B
layout(location = 4) in vec2 len; // P B
layout(location = 5) in float animation;
layout(location = 6) in vec3 oPos;
layout(location = 7) in vec3 bPos;

out vec3 vPos;
out vec3 vOPos;
out vec3 vBPos;

float easeInOutCubic(float t) {
    if ((t *= 2.0) < 1.0) {
        return 0.5 * t * t * t;
    } else {
        return 0.5 * ((t -= 2.0) * t * t + 2.0);
    }
}
float rate(float s, float e, float x) {
    return (x - s) / (e - s);
}
mat2 rot(float angle) {
  return mat2(cos(angle),-sin(angle),
              sin(angle),cos(angle));
}
// start end mid
vec3 bezier(vec3 p1, vec3 p2, vec3 p3, float t) {
    return t * t * p2 + 2. * t * (1. - t) * p3 + (1. - t) * (1. - t) * p1;
}

vec4 circle(float id, float textLen, float depth) {
    vec2 p = vec2(0., 0.);
    p.y += depth * .8 * clamp(aspect, 0., 1.);
    p *= rot(-2. * PI  / textLen * id );
    p.y += 1.;
    return vec4(p, sTime.x, eTime.x);
}
// 文字毎動く
vec4 line1(float id1, float id2, float depth) {
    vec2 pos = vec2(0.);
    pos.x += - min(depth * aspect * .8, 6.);
    pos.x += 2. * id1;
    pos.y += depth * .6 - 3. * id2;
    return vec4(pos, sTime.x, eTime.x);
}
// ブロックごと
vec4 line2(float id1, float id2, float depth) {
    vec2 pos = vec2(0.);
    pos.x += - min(depth * aspect * .8, 6.);
    pos.x += 2. * id1;
    pos.y += depth * .6 - 3. * id2;
    return vec4(pos, sTime.z, eTime.x);
}
vec4 center(float id1, float id2, float depth) {
    vec2 pos = vec2(0.);
    pos.x += - min(depth * aspect * .8, 6.);
    pos.x += 2. * id1;
    pos.y += 5. - 3. * id2;
    return vec4(pos, sTime.z, eTime.x);
}
// 4行計算
vec4 vertical(float id1, float id2, float num, float depth) {
    vec2 pos = vec2(0.);

    pos.y += depth * .8 - 2. - 2. * id1;
    pos.x += min(depth * aspect * .8, depth * .8) - depth * .25 * id2;
    return vec4(pos, sTime.x, eTime.x);
}
vec4 flowX(float id1, float depth) {
    vec2 pos = vec2(0.);
    pos.x += - min(depth * aspect * .8, 6.);
    pos.y += depth * .6 - 3. * id1;
    return vec4(pos, sTime.z, eTime.x);
}
vec4 flowY(float id1, float depth) {
    vec2 pos = vec2(0.);

    pos.y += depth * .8 - 2.;
    pos.x += min(depth * aspect * .8, depth * .8) - depth * .2 * id1;
    return vec4(pos, sTime.z, eTime.x);
}
vec4 expand() {
    return vec4(0. ,2.,sTime.y, eTime.z );
}
vec4 expand2(float depth) {

    return vec4(0. ,depth * .8 * clamp(aspect, 0., 1.) ,sTime.z, eTime.z );
}

void main() {
    float back = 90.;
    float front = 15.;
    vec3 pos = position;
    vec3 mPos = vec3(
        mouse.x * back * aspect,
        mouse.y * back,
        100. - back
    );
    vec3 particle = bPos; 
    particle.x += step(100. * aspect, particle.x) * (-200. * aspect);
    particle.x += step(particle.x, -100. * aspect) * (200. * aspect);
    particle.y += step(100., particle.y) * (-200.);
    particle.y += step(particle.y, -100.) * 200.;
    particle.z += step(110., particle.z) * (-205.);
    particle.z += step(particle.z, -100.) * (120.);
    particle += vec3(-clamp(mouse.xy, -.8, .8) * 5. *(1. - rate(-100., 100., clamp(particle.z, -100., 100.))), 1.) ;
    

    // get animation data
    vec4 d = vec4(0.);
    vec4 d1 = vertical(indexes.z, indexes.w, len.y, front);
    vec4 d2 = line1(indexes.z, indexes.w, front);
    vec4 d3 = line2(indexes.z, indexes.w, front);    
    vec4 d4 = circle(indexes.y, len.x, front);
    vec4 d5 = flowX(indexes.w, front);
    vec4 d6 = flowY(indexes.w, front);
    vec4 d7 = expand();
    vec4 d8 = expand2(front);//flowC(indexes.y, front);
    vec4 d9 = center(indexes.z, indexes.w, front);

    d =
        step(abs(animation - 1.), .1) * d1 +
        step(abs(animation - 2.), .1) * d2 +
        step(abs(animation - 3.), .1) * d3 +
        step(abs(animation - 4.), .1) * d4 +
        step(abs(animation - 5.), .1) * d5 +
        step(abs(animation - 6.), .1) * d6 +
        step(abs(animation - 7.), .1) * d7 +
        step(abs(animation - 8.), .1) * d8 +
        step(abs(animation - 9.), .1) * d9;

    float start = d.z;
    float end = d.w;
    vec3 destination = vec3(d.x, d.y, 100. - front);

    // vOPos 範囲外はマウス上
    float range = step(start - time, 2000.) * step(time - end, 1000.);
    vec3 origin = oPos * range + mix(mPos, particle, mode)  * (1. - range);    


    // 計算
    vec2 a = (destination - origin).xy;
    float slope = atan(a.y, a.x);
    float r = 10.;
    vec3 b = origin + (vec3(cos(slope), sin(slope), .0) * .3 + vec3(cos(slope + PI * .5), sin(slope + PI * .5), 0.) )* r;

    float prog1 = rate(start - 2000., start - 500., time);
    vec3 before = bezier(origin, destination, b, easeInOutCubic(clamp(prog1, 0., 1.)));
    float prog2 = rate(end + 500., end + 1000., time);
    vec3 after = pos + (vec3(pos.x, pos.y, 110.) - pos) * clamp(prog2, 0., 1.) * .1;
    float t = step(end, time);
    pos = before * (1. - t) + after * t;

    vBPos = particle;
    vOPos = origin;
    vPos = (pos * range + mix(mPos, particle, mode) * (1. - range));
}