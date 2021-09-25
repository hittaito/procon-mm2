#version 300 es

uniform mat4 mvpMatrix;

layout(location = 0) in vec3 position;
layout(location = 1) in vec2 texCoord;

out vec2 vTexCoord;

void main() {
    vTexCoord = texCoord;
    gl_Position = mvpMatrix * vec4(position, 1.);
}