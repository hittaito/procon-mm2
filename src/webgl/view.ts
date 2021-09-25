import { Common } from './common';
import v1frag from '../assets/view1.frag';
import v1vert from '../assets/view1.vert';
import v2frag from '../assets/view2.frag';
import v2vert from '../assets/view2.vert';
import pFrag from '../assets/pointer.frag';
import pVert from '../assets/pointer.vert';
import s1Vert from '../assets/sphere1.vert';
import s1Frag from '../assets/sphere1.frag';
import s2Vert from '../assets/sphere2.vert';
import s2Frag from '../assets/sphere2.frag';
import { mat4 } from 'gl-matrix';
import anime from 'animejs';
import Stats from 'stats.js';

export class View extends Common {
    prg1: WebGLProgram; // view1
    prg2: WebGLProgram; // view2
    prg3: WebGLProgram; // pointer
    prg4: WebGLProgram; // sphere1 == particle
    prg5: WebGLProgram; // sphere2 == particle
    uniform1: Map<string, WebGLUniformLocation>;
    uniform2: Map<string, WebGLUniformLocation>;
    uniform3: Map<string, WebGLUniformLocation>;
    unifrom4: Map<string, WebGLUniformLocation>;
    unifrom5: Map<string, WebGLUniformLocation>;
    uValue: {
        vpMat: mat4;
        nChar: number;
        nRow: number;
        time: number;
        mouse: number[];
        text: number;
        ortho: mat4;
        beat: number;
        mode: number;
    };
    vao1: WebGLVertexArrayObject[];
    vao2: WebGLVertexArrayObject;
    vao3: WebGLVertexArrayObject[];
    buffer: Buffer;
    backBuffer: BackBuffer;

    len: number;
    nParticle: number = 400;

    stats: Stats;

    constructor() {
        super();
    }
    setUp(gl: WebGL2RenderingContext, chars: Char[], len: number) {
        this.stats = new Stats();
        this.stats.showPanel(1);
        // document.body.appendChild(this.stats.dom);
        this.nParticle = innerWidth > 500 ? 800 : 400;
        this.len = chars.length;

        // TEXT view
        const shader1 = this.createShader(gl, v1vert, v1frag);
        if (!shader1) return;
        const varyings = ['vPos', 'vOPos', 'vBPos'];
        const prg1 = this.createProgram(gl, shader1, varyings);
        if (!prg1) return;
        this.prg1 = prg1;
        this.uniform1 = this.setUniformLocation(gl, prg1, [
            'time',
            'mouse',
            'aspect',
            'mode',
        ]);

        const shader2 = this.createShader(gl, v2vert, v2frag);
        if (!shader2) return;
        const prg2 = this.createProgram(gl, shader2, null);
        if (!prg2) return;
        this.prg2 = prg2;
        this.uniform2 = this.setUniformLocation(gl, prg2, [
            'vpMat',
            'nRow',
            'time',
            'mouse',
            'text',
            'aspect',
        ]);

        // pointer
        const shader3 = this.createShader(gl, pVert, pFrag);
        if (!shader3) return;
        const prg3 = this.createProgram(gl, shader3, null);
        if (!prg3) return;
        this.prg3 = prg3;
        this.uniform3 = this.setUniformLocation(gl, prg3, [
            'vpMat',
            'beat',
            'mouse',
            'aspect',
        ]);

        // particle
        const shader4 = this.createShader(gl, s1Vert, s1Frag);
        if (!shader4) return;
        const prg4 = this.createProgram(
            gl,
            shader4,
            ['vPos', 'vVel'],
            gl.INTERLEAVED_ATTRIBS
        );
        if (!prg4) return;
        this.prg4 = prg4;
        this.unifrom4 = this.setUniformLocation(gl, prg4, [
            'mouse',
            'aspect',
            'animation',
            'mode',
        ]);

        const shader5 = this.createShader(gl, s2Vert, s2Frag);
        if (!shader5) return;
        const prg5 = this.createProgram(gl, shader5, null);
        if (!prg5) return;
        this.prg5 = prg5;
        this.unifrom5 = this.setUniformLocation(gl, prg5, [
            'beat',
            'mouse',
            'vpMat',
        ]);

        const vMat = mat4.create();
        const pMat = mat4.create();
        const vpMat = mat4.create();
        const ortho = mat4.create();
        mat4.lookAt(vMat, [0, 0, -3], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(pMat, Math.PI / 2, innerWidth / innerHeight, 0.1, 100);
        mat4.mul(vpMat, pMat, vMat);
        mat4.lookAt(vMat, [0, 0, 0.5], [0, 0, 0], [0, 1, 0]);
        mat4.ortho(pMat, -1, 1, -1, 1, 0.1, 100);
        mat4.mul(ortho, pMat, vMat);

        this.uValue = {
            vpMat: vpMat,
            nChar: chars.length,
            nRow: Math.ceil(Math.sqrt(len)),
            time: 0,
            mouse: [0, 0],
            text: 5,
            ortho: ortho,
            beat: 0,
            mode: 0,
        };

        gl.enable(gl.DEPTH_TEST);
        gl.enable(gl.BLEND);
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        gl.depthFunc(gl.LEQUAL);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        const data1 = this.createAttribute(gl, chars);
        if (!data1) return;
        this.vao1 = data1[1] as WebGLVertexArrayObject[];
        this.buffer = data1[0] as Buffer;

        const vao2 = this.createAttribute2(gl);
        if (!vao2) return;
        this.vao2 = vao2;

        const data2 = this.createAttribute3(gl);
        if (!data2) return;
        this.vao3 = data2[1] as WebGLVertexArrayObject[];
        this.backBuffer = data2[0] as BackBuffer;

        this.render(gl, true);
    }
    render(gl: WebGL2RenderingContext, t: boolean) {
        this.stats.begin();
        const SIZE = 2048;
        const i = t ? 0 : 1;
        const vMat = mat4.create();
        const pMat = mat4.create();
        const tmpMat = mat4.create();
        mat4.lookAt(vMat, [0, 0, 100], [0, 0, 0], [0, 1, 0]);
        mat4.perspective(pMat, Math.PI / 2, innerWidth / innerHeight, 0.1, 200);
        mat4.mul(tmpMat, pMat, vMat);

        const time1 = this.uniform1.get('time');
        const mouse1 = this.uniform1.get('mouse');
        const aspect1 = this.uniform1.get('aspect');
        const mode1 = this.uniform1.get('mode');
        if (!time1 || !mouse1 || !aspect1 || !mode1) return;

        const time2 = this.uniform2.get('time');
        const vpMat2 = this.uniform2.get('vpMat');
        const nRow2 = this.uniform2.get('nRow');
        const text2 = this.uniform2.get('text');
        const mouse2 = this.uniform2.get('mouse');
        const aspect2 = this.uniform2.get('aspect');

        if (!vpMat2 || !nRow2 || !time2 || !mouse2 || !text2 || !aspect2)
            return;

        const vpMat3 = this.uniform3.get('vpMat');
        const mouse3 = this.uniform3.get('mouse');
        const aspect3 = this.uniform3.get('aspect');
        const beat3 = this.uniform3.get('beat');
        if (!vpMat3 || !mouse3 || !aspect3 || !beat3) return;

        const mouse6 = this.unifrom4.get('mouse');
        const aspect6 = this.unifrom4.get('aspect');
        const mode6 = this.unifrom4.get('mode');
        if (!mouse6 || !aspect6 || !mode6) return;

        const beat = this.unifrom5.get('beat');
        const vpMat = this.unifrom5.get('vpMat');
        if (!beat || !vpMat) return;

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // begin transform feedback

        // particle
        gl.useProgram(this.prg4);
        gl.bindVertexArray(this.vao3[i]);
        gl.uniform2f(mouse6, this.uValue.mouse[0], this.uValue.mouse[1]);
        gl.uniform1f(aspect6, innerWidth / innerHeight);
        gl.uniform1f(mode6, this.uValue.mode);
        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER,
            0,
            this.backBuffer.data[1 - i]
        );
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.nParticle);
        gl.disable(gl.RASTERIZER_DISCARD);

        gl.endTransformFeedback();
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);

        // text
        gl.useProgram(this.prg1);
        gl.viewport(0, 0, SIZE, SIZE);
        gl.bindVertexArray(this.vao1[i]);
        gl.uniform1f(time1, this.uValue.time);
        gl.uniform2f(mouse1, this.uValue.mouse[0], this.uValue.mouse[1]);
        gl.uniform1f(aspect1, innerWidth / innerHeight);
        gl.uniform1f(mode1, this.uValue.mode);

        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER,
            0,
            this.buffer.pPos[1 - i]
        );
        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER,
            1,
            this.buffer.oPos[1 - i]
        );
        gl.bindBufferBase(
            gl.TRANSFORM_FEEDBACK_BUFFER,
            2,
            this.buffer.bPos[1 - i]
        );
        gl.enable(gl.RASTERIZER_DISCARD);
        gl.beginTransformFeedback(gl.POINTS);
        gl.drawArrays(gl.POINTS, 0, this.len);
        gl.disable(gl.RASTERIZER_DISCARD);

        gl.endTransformFeedback();
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 0, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 1, null);
        gl.bindBufferBase(gl.TRANSFORM_FEEDBACK_BUFFER, 2, null);

        // begin draw

        // particle
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 1);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearDepth(1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.prg5);
        gl.bindVertexArray(this.vao3[i + 2]);
        gl.uniformMatrix4fv(vpMat, false, tmpMat);
        gl.uniform1f(beat, this.uValue.beat);
        gl.drawElementsInstanced(
            gl.TRIANGLES,
            6,
            gl.UNSIGNED_SHORT,
            0,
            this.nParticle
        );

        // text
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.useProgram(this.prg2);
        gl.bindVertexArray(this.vao1[i + 2]);
        gl.uniformMatrix4fv(vpMat2, false, tmpMat);
        gl.uniform2f(mouse2, this.uValue.mouse[0], this.uValue.mouse[1]);
        gl.uniform1f(nRow2, this.uValue.nRow);
        gl.uniform1f(time2, this.uValue.time);
        gl.uniform1i(text2, this.uValue.text);
        gl.uniform1f(aspect2, innerWidth / innerHeight);
        gl.drawElementsInstanced(
            gl.TRIANGLES,
            6,
            gl.UNSIGNED_SHORT,
            0,
            this.len
        );

        // pointer
        gl.useProgram(this.prg3);
        gl.bindVertexArray(this.vao2);
        gl.uniformMatrix4fv(vpMat3, false, tmpMat);
        gl.uniform2f(mouse3, this.uValue.mouse[0], this.uValue.mouse[1]);
        gl.uniform1f(aspect3, innerWidth / innerHeight);
        gl.uniform1f(beat3, this.uValue.beat);
        gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);

        gl.flush();

        this.stats.end();
        requestAnimationFrame(() => this.render(gl, !t));
    }
    timeUpdate(time: number) {
        if (this.uValue) {
            this.uValue.time = time;
        }
    }
    animationUpdate(b: boolean) {
        anime({
            targets: this.uValue,
            mode: b ? 1 : 0,
            duration: 600,
            easing: 'easeInCirc',
        });
    }
    beatUpdate(b: number) {
        if (this.uValue) {
            this.uValue.beat = b;
        }
    }
    mouseUpdate(x: number, y: number) {
        this.uValue.mouse = [x, y];
    }
    createAttribute(gl: WebGL2RenderingContext, chars: Char[]) {
        const pPos: number[] = [];
        const indexes: number[] = [];
        const sTime: number[] = [];
        const eTime: number[] = [];
        const len: number[] = [];
        const animation1: number[] = [];
        const animation2: number[] = [];
        const oPos: number[] = [];
        const bPos: number[] = [];

        const data: number[] = [];

        const position: number[] = [];
        const texCoord: number[] = [];
        const index: number[] = [];
        const W = 1;
        const aspect = window.innerWidth / innerHeight;

        chars.forEach((char, i) => {
            pPos.push(0, 0, 0);
            indexes.push(char.cIndex, char.pcIndex, char.bIndex, char.pbIndex);
            sTime.push(char.cStart, char.pStart, char.bStart);
            eTime.push(char.cEnd, char.pEnd, char.bEnd);
            len.push(char.pLength, char.bLength);
            animation1.push(char.animation[0]);
            animation2.push(char.animation[1]);
            oPos.push(0, 0, 0);
            const r1 = (Math.random() * 2 - 1) * 100 * aspect;
            const r2 = (Math.random() * 2 - 1) * 100;
            const r3 = (Math.random() * 2 - 1) * 100;
            bPos.push(r1, r2, r3);
        });

        // instance data
        position.push(-W, W, 0, W, W, 0, -W, -W, 0, W, -W, 0);
        texCoord.push(0, 1, 1, 1, 0, 0, 1, 0);
        index.push(0, 2, 1, 2, 3, 1);

        const buffers = {
            pPos: [this.createVBO(gl, pPos), this.createVBO(gl, pPos)],
            indexes: this.createVBO(gl, indexes),
            sTime: this.createVBO(gl, sTime),
            eTime: this.createVBO(gl, eTime),
            len: this.createVBO(gl, len),
            animation1: this.createVBO(gl, animation1),
            animation2: this.createVBO(gl, animation2),
            oPos: [this.createVBO(gl, oPos), this.createVBO(gl, oPos)],
            bPos: [this.createVBO(gl, bPos), this.createVBO(gl, bPos)],
            iPos: this.createVBO(gl, position),
            iTexCoord: this.createVBO(gl, texCoord),
        };

        const vao11 = gl.createVertexArray();
        const vao12 = gl.createVertexArray();
        const vao21 = gl.createVertexArray();
        const vao22 = gl.createVertexArray();
        if (!vao11 || !vao12 || !vao21 || !vao22) return;
        const vaos = [
            {
                vao: vao11,
                buffers: [
                    {
                        obj: buffers.pPos[0],
                        length: 3,
                        location: 0,
                    },
                    {
                        obj: buffers.indexes,
                        length: 4,
                        location: 1,
                    },
                    {
                        obj: buffers.sTime,
                        length: 3,
                        location: 2,
                    },
                    {
                        obj: buffers.eTime,
                        length: 3,
                        location: 3,
                    },
                    {
                        obj: buffers.len,
                        length: 2,
                        location: 4,
                    },
                    {
                        obj: buffers.animation1,
                        length: 1,
                        location: 5,
                    },
                    {
                        obj: buffers.oPos[0],
                        length: 3,
                        location: 6,
                    },
                    {
                        obj: buffers.bPos[0],
                        length: 3,
                        location: 7,
                    },
                ],
            },
            {
                vao: vao12,
                buffers: [
                    {
                        obj: buffers.pPos[1],
                        length: 3,
                        location: 0,
                    },
                    {
                        obj: buffers.indexes,
                        length: 4,
                        location: 1,
                    },
                    {
                        obj: buffers.sTime,
                        length: 3,
                        location: 2,
                    },
                    {
                        obj: buffers.eTime,
                        length: 3,
                        location: 3,
                    },
                    {
                        obj: buffers.len,
                        length: 2,
                        location: 4,
                    },
                    {
                        obj: buffers.animation1,
                        length: 1,
                        location: 5,
                    },
                    {
                        obj: buffers.oPos[1],
                        length: 3,
                        location: 6,
                    },
                    {
                        obj: buffers.bPos[1],
                        length: 3,
                        location: 7,
                    },
                ],
            },
            {
                vao: vao21,
                buffers: [
                    {
                        obj: buffers.pPos[0],
                        length: 3,
                        location: 0,
                        divisor: true,
                    },
                    {
                        obj: buffers.indexes,
                        length: 4,
                        location: 1,
                        divisor: true,
                    },
                    {
                        obj: buffers.sTime,
                        length: 3,
                        location: 2,
                        divisor: true,
                    },
                    {
                        obj: buffers.eTime,
                        length: 3,
                        location: 3,
                        divisor: true,
                    },
                    {
                        obj: buffers.len,
                        length: 2,
                        location: 4,
                        divisor: true,
                    },
                    {
                        obj: buffers.animation2,
                        length: 1,
                        location: 5,
                        divisor: true,
                    },
                    {
                        obj: buffers.iPos,
                        length: 3,
                        location: 6,
                    },
                    {
                        obj: buffers.iTexCoord,
                        length: 2,
                        location: 7,
                    },
                ],
                index: index,
            },
            {
                vao: vao22,
                buffers: [
                    {
                        obj: buffers.pPos[1],
                        length: 3,
                        location: 0,
                        divisor: true,
                    },
                    {
                        obj: buffers.indexes,
                        length: 4,
                        location: 1,
                        divisor: true,
                    },
                    {
                        obj: buffers.sTime,
                        length: 3,
                        location: 2,
                        divisor: true,
                    },
                    {
                        obj: buffers.eTime,
                        length: 3,
                        location: 3,
                        divisor: true,
                    },
                    {
                        obj: buffers.len,
                        length: 2,
                        location: 4,
                        divisor: true,
                    },
                    {
                        obj: buffers.animation2,
                        length: 1,
                        location: 5,
                        divisor: true,
                    },
                    {
                        obj: buffers.iPos,
                        length: 3,
                        location: 6,
                    },
                    {
                        obj: buffers.iTexCoord,
                        length: 2,
                        location: 7,
                    },
                ],
                index: index,
            },
        ];
        vaos.forEach((v) => {
            this.attachVAO(gl, v.buffers, v.vao, v.index);
        });

        return [buffers, [vao11, vao12, vao21, vao22]];
    }
    attachVAO(
        gl: WebGL2RenderingContext,
        buffers: VBO[],
        vao: WebGLVertexArrayObject,
        index?: number[]
    ) {
        gl.bindVertexArray(vao);
        buffers.forEach((buffer) => {
            gl.bindBuffer(gl.ARRAY_BUFFER, buffer.obj);
            if (!buffer.interleaved) {
                gl.enableVertexAttribArray(buffer.location);
                gl.vertexAttribPointer(
                    buffer.location,
                    buffer.length,
                    gl.FLOAT,
                    false,
                    0,
                    0
                );
                if (buffer.divisor) {
                    gl.vertexAttribDivisor(buffer.location, 1);
                }
            } else {
                buffer.interleaved.map((i) => {
                    gl.enableVertexAttribArray(i.location);
                    gl.vertexAttribPointer(
                        i.location,
                        i.length,
                        gl.FLOAT,
                        false,
                        buffer.length,
                        i.offset
                    );
                    if (i.divisor) {
                        gl.vertexAttribDivisor(i.location, 1);
                    }
                });
            }
        });
        if (index) {
            const ibo = gl.createBuffer() as WebGLBuffer;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
            gl.bufferData(
                gl.ELEMENT_ARRAY_BUFFER,
                new Int16Array(index),
                gl.STATIC_DRAW
            );
        }

        gl.bindVertexArray(null);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
    createVBO(gl: WebGL2RenderingContext, data: number[]) {
        const vbo = gl.createBuffer() as WebGLBuffer;
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        return vbo;
    }
    createAttribute2(gl: WebGL2RenderingContext) {
        const position: number[] = [];
        const index: number[] = [];
        position.push(-1, 1, 0, 1, 1, 0, -1, -1, 0, 1, -1, 0);
        index.push(0, 2, 1, 2, 3, 1);

        const vbo = this.createVBO(gl, position);
        // const ibo = this.createIBO(gl, index);
        const vao = gl.createVertexArray();
        if (!vao) return;
        this.attachVAO(
            gl,
            [
                {
                    obj: vbo,
                    length: 3,
                    location: 0,
                },
            ],
            vao,
            index
        );
        return vao;
    }
    createAttribute3(gl: WebGL2RenderingContext) {
        const data: number[] = [];
        const position: number[] = [];
        const texCoord: number[] = [];
        const index: number[] = [];
        const aspect = innerWidth / innerHeight;
        for (let i = 0; i < this.nParticle; i++) {
            const r1 = (Math.random() * 2 - 1) * 100 * aspect;
            const r2 = (Math.random() * 2 - 1) * 100;
            const r3 = (Math.random() * 2 - 1) * 100;
            const r4 = Math.random() * Math.PI * 2;
            const r5 = Math.random() * Math.PI * 2;
            data.push(
                r1,
                r2,
                r3,
                0.1 * Math.cos(r4) * Math.sin(r5),
                0.1 * Math.sin(r4) * Math.sin(r5),
                0.1 * Math.cos(r5)
            );
        }
        const W = 1.8;
        // instance data
        position.push(-W, W, 0, W, W, 0, -W, -W, 0, W, -W, 0);
        texCoord.push(0, 1, 1, 1, 0, 0, 1, 0);
        index.push(0, 2, 1, 2, 3, 1);

        const vbo = this.createVBO(gl, data);
        gl.bindBuffer(gl.ARRAY_BUFFER, vbo);

        const vbos = {
            data: [this.createVBO(gl, data), this.createVBO(gl, data)],
            iPos: this.createVBO(gl, position),
            iTexCoord: this.createVBO(gl, texCoord),
        };

        const vao11 = gl.createVertexArray();
        const vao12 = gl.createVertexArray();
        const vao21 = gl.createVertexArray();
        const vao22 = gl.createVertexArray();
        if (!vao11 || !vao12 || !vao21 || !vao22) return;
        const vaos = [
            {
                vao: vao11,
                buffers: [
                    {
                        obj: vbos.data[0],
                        length: 24,
                        location: 0,
                        interleaved: [
                            {
                                location: 0,
                                length: 3,
                                offset: 0,
                            },
                            {
                                location: 1,
                                length: 3,
                                offset: 12,
                            },
                        ],
                    },
                ],
            },
            {
                vao: vao12,
                buffers: [
                    {
                        obj: vbos.data[1],
                        length: 24,
                        location: 0,
                        interleaved: [
                            {
                                location: 0,
                                length: 3,
                                offset: 0,
                            },
                            {
                                location: 1,
                                length: 3,
                                offset: 12,
                            },
                        ],
                    },
                ],
            },
            {
                vao: vao21,
                buffers: [
                    {
                        obj: vbos.data[0],
                        length: 24,
                        location: 0,
                        divisor: true,
                        interleaved: [
                            {
                                location: 0,
                                length: 3,
                                offset: 0,
                                divisor: true,
                            },
                            {
                                location: 1,
                                length: 3,
                                offset: 12,
                                divisor: true,
                            },
                        ],
                    },
                    {
                        obj: vbos.iPos,
                        length: 3,
                        location: 2,
                    },
                    {
                        obj: vbos.iTexCoord,
                        length: 2,
                        location: 3,
                    },
                ],
                index: index,
            },
            {
                vao: vao22,
                buffers: [
                    {
                        obj: vbos.data[1],
                        length: 24,
                        location: 0,
                        divisor: true,
                        interleaved: [
                            {
                                location: 0,
                                length: 3,
                                offset: 0,
                                divisor: true,
                            },
                            {
                                location: 1,
                                length: 3,
                                offset: 12,
                                divisor: true,
                            },
                        ],
                    },
                    {
                        obj: vbos.iPos,
                        length: 3,
                        location: 2,
                    },
                    {
                        obj: vbos.iTexCoord,
                        length: 2,
                        location: 3,
                    },
                ],
                index: index,
            },
        ];
        vaos.forEach((v) => {
            this.attachVAO(gl, v.buffers, v.vao, v.index);
        });

        return [vbos, [vao11, vao12, vao21, vao22]];
    }
}
interface VBO {
    obj: WebGLBuffer | WebGLBuffer[];
    location: number;
    length: number;
    interleaved?: {
        location: number;
        length: number;
        offset: number;
        divisor?: boolean;
    }[];
    divisor?: boolean;
}
interface Buffer {
    pPos: WebGLBuffer[];
    oPos: WebGLBuffer[];
    bPos: WebGLBuffer[];
    [key: string]: WebGLBuffer;
}
interface BackBuffer {
    data: WebGLBuffer[];
    [key: string]: WebGLBuffer;
}
