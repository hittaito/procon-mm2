#version 300 es
precision highp float;

uniform vec2 mouse;
uniform float aspect;
uniform mat4 vpMat;

layout(location = 0) in vec3 position;

out vec2 vTexCoord;

void main() {
    float back = 85.;
    vec3 mPos = vec3(
        mouse.x * back * aspect,
        mouse.y * back,
        100. - back
    );
    vTexCoord = position.xy;
    gl_Position = vpMat * vec4(position * 10. + mPos, 1.);
}