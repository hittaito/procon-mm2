#version 300 es
precision highp float;

#define PI 3.14159

uniform mat4 vpMat;
uniform float nRow;
uniform float time;
uniform vec2 mouse;
uniform float aspect;

layout(location = 0) in vec3 position;
layout(location = 1) in vec4 indexes; // C CinP CinB BinP
layout(location = 2) in vec3 sTime; // C P B
layout(location = 3) in vec3 eTime; // C P B
layout(location = 4) in vec2 len; // P B
layout(location = 5) in float animation;
layout(location = 6) in vec3 iPos;// instance pos
layout(location = 7) in vec2 iTexCoord;

out vec2 vTexCoord;
out vec2 vUv;
out float vProgress;
out float vBefore;
out vec4 vColor;
out float vAnime;

float easeOutCirc(float x) {
    return sqrt(1. - pow(x - 1., 2.));
}
float easeInCirc(float x) {
    return 1. - sqrt(1. - pow(x, 2.));
}
float easeInSin(float x) {
    return 1. - cos((x * PI) * .5);
}
float easeOutSin(float x) {
    return sin((x * PI) * .5);
}
float rate(float s, float e, float x) {
    return (x - s) / (e - s);
}
mat2 rot(float angle) {
  return mat2(cos(angle),-sin(angle),
              sin(angle),cos(angle));
}

vec3 expand(float l, float bp, float ap){
    float depth = 10. ;
    float edge = (l - 1.) * .5 * 2.;
    float dx = ((- edge) + (2. * edge) * indexes.z / (l - 1.) ) * easeOutCirc(clamp(bp, 0., 1.));
    dx -= ((- edge) + (2. * edge) * indexes.z / (len.y - 1.)) * easeOutCirc(clamp(ap, .0, 1.));
    return vec3(dx, 0., 0.);
}
vec3 expandC(float id, float l, float bp, float ap) {
    float depth = 10. * clamp(aspect, 0., 1.);
    float alpha = 2. * PI / l * id;
    float x = depth * cos(PI * .25 - alpha);
    float y = depth * sin(PI * .25 - alpha);
    float dx = x * easeOutCirc(clamp(bp, .0, 1.)) - x *clamp(ap, .0, 1.);
    float dy = y * easeOutCirc(clamp(bp, .0, 1.)) - y *clamp(ap, .0, 1.);
    
    return vec3(dx, dy, 0.);
}
vec3 flowX(float idx, float bp, float ap) {
    float dx = idx * 2. * easeOutCirc(clamp(bp, .0, 1.));
    dx -= idx * 2. * easeInCirc(clamp(ap, .0, 1.));
    return vec3(dx, 0., 0.);
}
vec3 flowY(float idx, float bp, float ap) {
    float dy = - idx * 2. * easeOutCirc(clamp(bp, .0, 1.));
    dy += idx * 2. * easeInCirc(clamp(ap, .0, 1.));
    return vec3(0., dy, 0.);
}
vec3 flowC(float idx, vec3 p, float bp, float ap) {
    vec3 o = p;
    o.y -= 2.;
    o.xy *= rot(PI);
    o.xy *= rot((-.66 * PI - .66 * PI * idx / (len.y - 1.)) * easeOutCirc(clamp(bp, .0, 1.)));
    o.xy *= rot((-.66 * PI - .66 * PI * (len.y - idx) / (len.y - 1.)) * easeOutCirc(clamp(ap, .0, 1.)));
    o.y += 2.;

    return o - p;
}

vec3 hop(float bp, float ap) {
    float delta = 1.5;
    float dy = delta * easeOutSin(clamp(bp, .0, 1.));
    dy -= delta * easeInSin(clamp(ap, .0, 1.));
    return vec3(0., dy, 0.);
}
vec3 mHop(vec3 p, float bp) {
    float a = clamp(bp, 0.,1.);
    p.x += .25 * sin(a * 2. * PI) * step(0., p.x);
    p.x -= .25 * sin(a * 2. * PI) * step(0., -p.x);
    p.y -= .25 * sin(a * 2. * PI) * step(0., p.y);
    p.y += .25 * sin(a * 2. * PI) * step(0., -p.y);
    return p;
}
vec3 mRot(vec3 p, float bp) {
    p.xz *= rot(- PI * 2. * clamp(bp, 0.,1.));
    return p;
}
vec3 mEnlarge(vec3 p, float bp) {
    float a = clamp(bp, 0.,1.);
    p.x += .25 * sin(a * 1. * PI) * step(0., p.x);
    p.x -= .25 * sin(a * 1. * PI) * step(0., -p.x);
    p.y += .25 * sin(a * 1. * PI) * step(0., p.y);
    p.y -= .25 * sin(a * 1. * PI) * step(0., -p.y);
    return p;
}
vec3 mFlowCenter(vec3 pos, float bp) {
    vec3 p = pos;
    pos.x *= clamp(bp, .0,1.);
    return pos;
}
vec3 mFlowLeft(vec3 pos, float bp) {
    vec3 p = pos;
    p.x += 1.;
    p.x *= clamp(bp, .0,1.);
    p.x -= 1.;
    return p;
}
vec3 mFlowLeft2(vec3 pos, float st, float ap) {
    vec3 p = pos;
    p.x += 1.;
    p.x *= step(.0, st);
    p.x *= 1. - clamp(ap, .0, 1.);
    p.x -= 1.;
    return p;
}
vec3 mFLowTop(vec3 pos, float bp) {
    pos.y -=1.;
    pos.y *= clamp(bp, .0,1.);
    pos.y += 1.;
    return pos;
}
vec3 mFlowBottom(vec3 pos, float bp) {
    pos.y +=1.;
    pos.y *= clamp(bp, .0,1.);
    pos.y -= 1.;
    return pos;
}
void main() {
    // texCoord
    float iChar = indexes.x;
    float w = 1. / nRow;
    float x = mod(iChar, nRow);
    float y = nRow - floor(iChar / nRow) - 1.;
    
    vTexCoord = vec2(
        w * (x + iTexCoord.x),
        w * (y + iTexCoord.y)
    );
    vec3 progress = vec3(
        rate(sTime.x, eTime.x, time),
        rate(sTime.y, eTime.y, time),
        rate(sTime.z, eTime.z, time)
    );
    vUv = iTexCoord;
    vec3 beforeProgress = vec3(
        rate(sTime.x - 500., sTime.x, time),
        rate(sTime.y - 500., sTime.y, time),
        rate(sTime.z - 500., sTime.z, time)
    );
    vec3 afterProgress = vec3(
        rate(eTime.x + 500., eTime.x + 1000., time),
        rate(eTime.y + 500., eTime.y + 1000., time),
        rate(eTime.z + 500., eTime.z + 1000., time)
    );
    vProgress = progress.x;
    vBefore = beforeProgress.x;


    // position move
    vec3 pos = position;
    float terminate1 = rate(eTime.z + 999., eTime.z + 1000., time);
    float terminate2 = rate(eTime.z - 500., eTime.z, time);
    vec3 d1 = expand(len.y, beforeProgress.z, terminate1);
    vec3 d2 = flowX(indexes.z, beforeProgress.z, afterProgress.x);
    vec3 d3 = flowY(indexes.z, beforeProgress.z, afterProgress.x);
    vec3 d4 = hop(beforeProgress.x, progress.x);
    vec3 d5 = flowC(indexes.z, pos, beforeProgress.z, terminate2);
    //vec3 d6 = expandC(indexes.y, len.x, beforeProgress.x, terminate2);
    
    pos +=
        step(abs(animation - 1.), .1) * d1 +
        step(abs(animation - 2.), .1) * d2 +
        step(abs(animation - 3.), .1) * d3 +
        step(abs(animation - 4.), .1) * d4 +
        step(abs(animation - 5.), .1) * d5;

    // instance motion
    vec3 instance = iPos;
    vec3 m1 = mHop(instance, beforeProgress.x);
    vec3 m2 = mFlowLeft2(instance, time - (sTime.z - 500.), terminate2);
    vec3 m2_1 = mEnlarge(m2, beforeProgress.x);
    vec3 m3 = mEnlarge(instance, beforeProgress.x);
    vec3 m4 = mFLowTop(instance, beforeProgress.x);
    vec3 m5 = mFlowLeft(instance, beforeProgress.x);
    vec3 m6 = mFlowBottom(instance, beforeProgress.x);
    vec3 m7 = mFlowCenter(instance, beforeProgress.x);

    instance = 
        step(abs(animation     ), .1) * instance + 
        step(abs(animation - 1.), .1) * instance + 
        step(abs(animation - 2.), .1) * instance + 
        step(abs(animation - 3.), .1) * instance + 
        step(abs(animation - 4.), .1) * m1 +
        step(abs(animation - 5.), .1) * m2_1 + 
        step(abs(animation - 6.), .1) * instance +
        step(abs(animation - 7.), .1) * instance +
        step(abs(animation - 8.), .1) * instance +
        step(abs(animation - 9.), .1) * instance +
        step(abs(animation - 10.), .1) * instance +
        step(abs(animation - 11.), .1) * m3 +
        step(abs(animation - 12.), .1) * m4 +
        step(abs(animation - 13.), .1) * m5 +
        step(abs(animation - 14.), .1) * m6 +
        step(abs(animation - 15.), .1) * m7;


    gl_Position = vpMat * vec4(pos + instance + mouse.x * aspect *.0, 1.);

    // fragment motion pattern
    vAnime = step(abs(animation - 1.), .1) * 0. +
             step(abs(animation - 2.), .1) * 0. +
             step(abs(animation - 3.), .1) * 0. +
             step(abs(animation - 4.), .1) * 0. +
             step(abs(animation - 5.), .1) * 0. +
             step(abs(animation - 6.), .1) * 2. +
             step(abs(animation - 7.), .1) * 4. +
             step(abs(animation - 8.), .1) * 5. +
             step(abs(animation - 9.), .1) * 1. +
             step(abs(animation - 10.), .1) * 3. +
             step(abs(animation - 11.), .1) * 0. +
             step(abs(animation - 12.), .1) * 0. +
             step(abs(animation - 13.), .1) * 0. +
             step(abs(animation - 14.), .1) * 0. +
             step(abs(animation - 15.), .1) * 0.;
    vec4 col1 = vec4(0., 60. / 255., 115. / 255., 1.);
    vec4 col2 = vec4(100. / 255., 149./ 255., 237./255., 1.);
    float b = step(sTime.z - 1000., time) * (1. - clamp(afterProgress.y , .0, 1.));
    vec4 col = col2 * b + col1 * (1. - b);
    vColor = col;
}