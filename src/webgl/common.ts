export class Common {
    createShader(gl: WebGL2RenderingContext, vert: string, frag: string) {
        const vs = gl.createShader(gl.VERTEX_SHADER);
        if (!vs) return;
        gl.shaderSource(vs, vert);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(vs));
            console.log(vert);
            return;
        }

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        if (!fs) return;
        gl.shaderSource(fs, frag);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.error(gl.getShaderInfoLog(fs));
            console.log(frag);
            return;
        }
        return {
            frag: fs,
            vert: vs,
        };
    }
    createProgram(
        gl: WebGL2RenderingContext,
        shader: Shader,
        varyings: string[] | null,
        type = gl.SEPARATE_ATTRIBS
    ) {
        const prg = gl.createProgram();
        if (!prg) return;
        gl.attachShader(prg, shader.vert);
        gl.attachShader(prg, shader.frag);
        if (varyings) {
            gl.transformFeedbackVaryings(prg, varyings, type);
        }
        gl.linkProgram(prg);
        if (!gl.getProgramParameter(prg, gl.LINK_STATUS)) {
            console.error(gl.getProgramInfoLog(prg));
            return;
        }
        return prg;
    }
    setUniformLocation(
        gl: WebGL2RenderingContext,
        prg: WebGLProgram,
        uniforms: string[]
    ) {
        const locations = new Map<string, WebGLUniformLocation>();
        uniforms.forEach((key) => {
            const u = gl.getUniformLocation(prg, key);
            if (!u) return;
            locations.set(key, u);
        });
        return locations;
    }

    setVAO(
        gl: WebGL2RenderingContext,
        data: number[],
        location: number,
        length: number
    ) {
        const vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, length, gl.FLOAT, false, 0, 0);
    }
    createVBO(gl: WebGL2RenderingContext, data: number[]) {
        const vbo = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }
    createIBO(gl: WebGL2RenderingContext, data: number[]) {
        const ibo = gl.createBuffer();
        if (!ibo) return;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Int16Array(data),
            gl.STATIC_DRAW
        );
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        return ibo;
    }
    createBuffer(gl: WebGL2RenderingContext, size: number | null) {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) return;
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        const texture = gl.createTexture();
        if (!texture) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        if (size) {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                size,
                size,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null
            );
        } else {
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                window.innerWidth,
                window.innerHeight,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                null
            );
        }

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0
        );
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {
            frameBuffer,
            textures: [texture],
        };
    }
    createMRTBuffer(gl: WebGL2RenderingContext, size: number, count: number) {
        const frameBuffer = gl.createFramebuffer();
        if (!frameBuffer) return;
        const textures: WebGLTexture[] = [];
        gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
        for (let i = 0; i < count; i++) {
            const tex = gl.createTexture();
            if (!tex) return;
            textures[i] = tex;
            gl.bindTexture(gl.TEXTURE_2D, textures[i]);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA32F,
                size,
                size,
                0,
                gl.RGBA,
                gl.FLOAT,
                null
            );
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.CLAMP_TO_EDGE
            );
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.CLAMP_TO_EDGE
            );

            gl.framebufferTexture2D(
                gl.FRAMEBUFFER,
                gl.COLOR_ATTACHMENT0 + i,
                gl.TEXTURE_2D,
                textures[i],
                0
            );
        }

        gl.bindTexture(gl.TEXTURE_2D, null);

        const attach = [...new Array(count)].map(
            (_, i) => gl.COLOR_ATTACHMENT0 + i
        );
        gl.drawBuffers(attach);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        return {
            frameBuffer,
            textures,
        };
    }
}
export interface Shader {
    frag: WebGLShader;
    vert: WebGLShader;
}
export interface FrameBuffer {
    frameBuffer: WebGLFramebuffer;
    textures: WebGLTexture[];
}
