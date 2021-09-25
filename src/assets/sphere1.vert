#version 300 es
precision highp float;

#define PI 3.14159

uniform vec2 mouse;
uniform float aspect;
uniform float mode;

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 velocity;

out vec3 vPos;
out vec3 vVel;

float rate(float s, float e, float x) {
    return (x - s) / (e - s);
}

void main() {
    vec3 pos = position + 0. * vec3(mouse.xy, 0.);
    vec3 vel = velocity;
    
    pos += vel;

    pos.x += step(100. * aspect, pos.x) * (-200. * aspect);
    pos.x += step(pos.x, -100. * aspect) * (200. * aspect);
    pos.y += step(100., pos.y) * (-200.);
    pos.y += step(pos.y, -100.) * 200.;
    pos.z += step(105., pos.z) * (-205.);
    pos.z += step(pos.z, -100.) * (205.);

    // move
    pos += mode * vec3(-clamp(mouse.xy, -.8, .8) * 5. *(1. - rate(-100., 100., clamp(pos.z, -100., 100.))), 1.) ;

    vPos = pos;
    vVel = vel;
}