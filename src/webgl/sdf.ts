import * as webfont from 'webfontloader';
import { Common } from './common';
import t1frag from '../assets/text1.frag';
import t1vert from '../assets/text1.vert';
import t2frag from '../assets/text2.frag';
import t2vert from '../assets/text2.vert';
import t3frag from '../assets/text3.frag';
import t3vert from '../assets/text3.vert';
import { mat4 } from 'gl-matrix';

export class SDF extends Common {
    async generate(
        gl: WebGL2RenderingContext,
        chars: { id: number; c: string }[],
        size: number
    ) {
        await this.loadfont();
        const texture = this.createTextCanvas(gl, chars, size);
        gl.viewport(0, 0, size, size);
        if (!texture) return;
        return this.setUp(gl, texture, size);
    }
    setUp(gl: WebGL2RenderingContext, texture: WebGLTexture, size: number) {
        // create 1st program
        const shader1 = this.createShader(gl, t1vert, t1frag);
        if (!shader1) return;
        const prg1 = this.createProgram(gl, shader1, null);
        if (!prg1) return;
        const uniform1 = this.setUniformLocation(gl, prg1, [
            'mvpMatrix',
            'img',
        ]);
        const vao1 = this.createAttribute(gl, false);
        if (!vao1) return;

        // create 2nd program
        const shader2 = this.createShader(gl, t2vert, t2frag);
        if (!shader2) return;
        const prg2 = this.createProgram(gl, shader2, null);
        if (!prg2) return;
        const uniform2 = this.setUniformLocation(gl, prg2, [
            'mvpMatrix',
            'img1',
            'img2',
        ]);
        const vao2 = this.createAttribute(gl, true);
        if (!vao2) return;

        // create 3rd program
        const shader3 = this.createShader(gl, t3vert, t3frag);
        if (!shader3) return;
        const prg3 = this.createProgram(gl, shader3, null);
        if (!prg3) return;
        const uniform3 = this.setUniformLocation(gl, prg3, [
            'mvpMatrix',
            'img0',
            'img1',
            'img2',
        ]);

        // create matrix
        const vMat = mat4.create();
        const pMat = mat4.create();
        const vpMat = mat4.create();
        mat4.lookAt(vMat, [0, 0, 0.5], [0, 0, 0], [0, 1, 0]);
        mat4.ortho(pMat, -1, 1, -1, 1, 0.1, 100);
        mat4.mul(vpMat, pMat, vMat);

        // create frame buffer
        const b1 = this.createMRTBuffer(gl, size, 2);
        if (!b1) return;
        const b2 = this.createMRTBuffer(gl, size, 2);
        if (!b2) return;
        const buffer1 = [b1, b2];
        const buffer2 = this.createBuffer(gl, size);
        if (!buffer2) return;

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, b1.textures[0]);
        gl.activeTexture(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, b1.textures[1]);
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, b2.textures[0]);
        gl.activeTexture(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, b2.textures[1]);
        gl.activeTexture(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, buffer2.textures[0]);

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.CULL_FACE);

        // rendering process

        // first
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer1[0].frameBuffer);
        gl.useProgram(prg1);

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindVertexArray(vao1);
        const img1 = uniform1.get('img');
        const mvpMatrix1 = uniform1.get('mvpMatrix');
        if (!img1 || !mvpMatrix1) return;
        gl.uniform1i(img1, 0);
        gl.uniformMatrix4fv(mvpMatrix1, false, vpMat);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        // second

        const img21 = uniform2.get('img1');
        const img22 = uniform2.get('img2');
        const mvpMatrix2 = uniform2.get('mvpMatrix');
        if (!img21 || !img22 || !mvpMatrix2) return;
        for (let i = 0; i < 8; i++) {
            // 偶数回ループ
            const idx = i % 2;
            gl.bindFramebuffer(gl.FRAMEBUFFER, buffer1[1 - idx].frameBuffer);
            gl.useProgram(prg2);
            gl.clearColor(0, 0, 0, 1);
            gl.clearDepth(1);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
            gl.bindVertexArray(vao2);

            gl.uniform1i(img21, 1 + idx * 2);
            gl.uniform1i(img22, 2 + idx * 2);
            gl.uniformMatrix4fv(mvpMatrix2, false, vpMat);
            gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        }

        // third
        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer2.frameBuffer);
        gl.useProgram(prg3);

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindVertexArray(vao2);
        const img30 = uniform3.get('img0');
        const img31 = uniform3.get('img1');
        const img32 = uniform3.get('img2');
        const mvpMatrix3 = uniform3.get('mvpMatrix');
        if (!img30 || !img31 || !img32 || !mvpMatrix3) return;
        gl.uniform1i(img30, 0);
        gl.uniform1i(img31, 1);
        gl.uniform1i(img32, 2);
        gl.uniformMatrix4fv(mvpMatrix3, false, vpMat);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.flush();
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // delete unused data
        gl.deleteTexture(texture);
        gl.deleteTexture(b1.textures[0]);
        gl.deleteTexture(b1.textures[1]);
        gl.deleteTexture(b2.textures[0]);
        gl.deleteTexture(b2.textures[1]);
        gl.deleteFramebuffer(b1.frameBuffer);
        gl.deleteFramebuffer(b2.frameBuffer);
    }
    createTextCanvas(
        gl: WebGL2RenderingContext,
        chars: { id: number; c: string }[],
        size: number
    ) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        const SIZE = size;
        const text = chars.map((c) => c.c).join('');

        canvas.width = SIZE;
        canvas.height = SIZE;
        const fontSize = SIZE / Math.ceil(Math.sqrt(text.length));

        context.clearRect(0, 0, SIZE, SIZE);
        context.font = `bold ${fontSize * 0.9}px \'Noto Sans JP\'`;
        context.textAlign = 'center';
        context.fillStyle = '#ffffff';
        text.split('').forEach((c, i) => {
            const x = (i % (SIZE / fontSize)) * fontSize + fontSize / 2;
            const y =
                Math.floor(i / (SIZE / fontSize)) * fontSize + fontSize * 0.9;
            context.fillText(c, x, y, fontSize);
        });

        const texture = gl.createTexture();
        if (!texture) return;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            canvas
        );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(
            gl.TEXTURE_2D,
            gl.TEXTURE_MIN_FILTER,
            gl.LINEAR_MIPMAP_NEAREST
        );
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);

        return texture;
    }
    loadfont() {
        return new Promise((resolve) => {
            webfont.load({
                google: {
                    families: ['Noto+Sans+JP:700'],
                },
                active: () => resolve(null),
            });
        });
    }
    createAttribute(gl: WebGL2RenderingContext, invert: boolean) {
        const position = [
            -1.0, 1.0, 0.0, 1.0, 1.0, 0.0, -1.0, -1.0, 0.0, 1.0, -1.0, 0.0,
        ];
        const texCoord = [];
        if (!invert) {
            texCoord.push(0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 1.0, 1.0);
        } else {
            texCoord.push(0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0);
        }
        const index = [0, 2, 1, 2, 3, 1];

        const vao = gl.createVertexArray();
        if (!vao) return;

        gl.bindVertexArray(vao);
        this.setVAO(gl, position, 0, 3);
        this.setVAO(gl, texCoord, 1, 2);

        const ibo = gl.createBuffer();
        if (!ibo) return;
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        gl.bufferData(
            gl.ELEMENT_ARRAY_BUFFER,
            new Int16Array(index),
            gl.STATIC_DRAW
        );

        gl.bindVertexArray(null);

        return vao;
    }
}
