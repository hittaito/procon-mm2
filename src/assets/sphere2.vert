#version 300 es
precision highp float;

#define PI 3.14159

// uniform vec2 mouse;
uniform mat4 vpMat; 

layout(location = 0) in vec3 position;
layout(location = 1) in vec3 velocity;
layout(location = 2) in vec3 iPos;
layout(location = 3) in vec2 iTexCoord;

out vec4 vColor;
out vec2 vTexCoord;

float rate(float s, float e, float x) {
    return (x - s) / (e - s);
}

void main() {
    vec3 pos = position;
    vec3 vel = velocity;

    vTexCoord = iTexCoord;
    vec4 col1 = vec4(255. / 255., 243./ 255., 60./255., .4);
    vec4 col2 = vec4(153. / 255., 110./ 255., 0./255., .4); 
    vColor = mix(col2, col1, rate(-100., 90.,clamp(pos.z, -100., 100.)));
    gl_Position = vpMat * vec4(pos + iPos, 1.);
}