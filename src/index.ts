import { IPhrase, IPlayerApp, IVideo, Player } from 'textalive-app-api';
import { SDF } from './webgl/sdf';
import { View } from './webgl/view';
import block from './data/Ch4RQPG1Tmo.json';

export class Main {
    SIZE = 1024;
    view?: View;
    width: number;
    height: number;
    isFullScreen = false;
    constructor() {
        this.init();
    }
    init() {
        const canvas = document.getElementById('contents') as HTMLCanvasElement;
        this.width = innerWidth;
        this.height = innerHeight;

        const gl = canvas.getContext('webgl2');
        if (gl === null) {
            const e = document.getElementById('error1') as HTMLDivElement;
            e.hidden = false;
            return;
        }
        const l = gl.getExtension('EXT_color_buffer_float');
        if (!l) {
            const e = document.getElementById('error2') as HTMLDivElement;
            e.hidden = false;
            return;
        }
        const player = new Player({
            app: { token: process.env.TOKEN as string },
            mediaElement: document.getElementById('media') as HTMLElement,
        });
        player.addListener({
            onAppReady: (app) => this.onReady(app, player),
            onVideoReady: (app) => this.onVideoReady(app, player, gl),
            onPlay: () => this.onStart(),
            onStop: () => this.onStop(),
            onPause: () => this.onStop(),
            onTimeUpdate: (t) => this.onTimeUpdate(t, player),
        });

        canvas.addEventListener('mousemove', (event) => this.onMove(event));
        canvas.addEventListener('touchmove', (event) => this.onToutch(event));
        canvas.addEventListener(
            'touchmove',
            (e) => {
                e.preventDefault();
            },
            { passive: false }
        );
        const btn = document.getElementById('btn-unlock');
        if (!document.fullscreenEnabled && btn) {
            btn.hidden = true;
        }
        btn?.addEventListener('click', () => {
            if (this.isFullScreen) {
                document.exitFullscreen();
                btn.textContent = '全画面表示';
                this.isFullScreen = false;
            } else {
                if (document.fullscreenEnabled) {
                    document.body.requestFullscreen();
                    btn.textContent = '全画面解除';
                    this.isFullScreen = true;
                }
            }
        });
    }
    onReady(app: IPlayerApp, player: Player) {
        player.createFromSongUrl('http://www.youtube.com/watch?v=Ch4RQPG1Tmo', {
            video: {
                // 音楽地図訂正履歴: https://songle.jp/songs/2121407/history
                beatId: 3953917,
                repetitiveSegmentId: 2099665,

                // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/www.youtube.com%2Fwatch%3Fv=Ch4RQPG1Tmo
                lyricId: 52063,
                lyricDiffId: 5149,
            },
        });
        ``;
    }
    onVideoReady(app: IVideo, player: Player, gl: WebGL2RenderingContext) {
        const sdf = new SDF();
        const ch = this.chMap(app.phrases);
        const chars = this.convert(app.phrases, ch);
        sdf.generate(gl, ch, this.SIZE).then(() => {
            this.onResize(gl, true);
            window.addEventListener('resize', () => {
                this.onResize(gl);
            });

            this.view = new View();
            this.view.setUp(gl, chars, ch.length);

            const btn = document.getElementById(
                'btn-start'
            ) as HTMLButtonElement;
            btn.addEventListener('click', () => {
                if (player.isPlaying) {
                    player.requestPause();
                } else {
                    player.requestPlay();
                }
            });
            const btn2 = document.getElementById('toggle') as HTMLButtonElement;
            btn2.addEventListener('click', (e) => {
                if (e.target instanceof HTMLInputElement && this.view) {
                    this.view.animationUpdate(e.target.checked);
                }
            });
        });
        const bar = document.getElementById('bar') as HTMLInputElement;
        bar.max = String(app.duration);
        bar.addEventListener('input', (e) => {
            if (e.target instanceof HTMLInputElement) {
                player.timer.seek(Number(e.target.value));
            }
        });
    }
    onStart() {
        const btn = document.getElementById('btn-start');
        if (btn) {
            btn.textContent = 'STOP';
        }
    }
    onTimeUpdate(t: number | null, player: Player) {
        if (!this.view || !t) return;
        this.view.timeUpdate(t);
        const b = player.findBeat(t);
        if (!b) return;
        this.view.beatUpdate(b.progress(t));
        const bar = document.getElementById('bar') as HTMLInputElement;
        bar.value = String(t);
    }
    onStop() {
        const btn = document.getElementById('btn-start');
        if (btn) {
            btn.textContent = 'START';
        }
    }
    onResize(gl: WebGL2RenderingContext, force = false) {
        const W = window.innerWidth;
        const H = window.innerHeight;

        if (this.width !== W || this.height !== H || force) {
            this.width = W;
            this.height = H;
            const canvas = document.getElementById(
                'contents'
            ) as HTMLCanvasElement;
            let dpr = window.devicePixelRatio || 2;
            // モニタだと粗くなるので強制的にあげる（よくわかってない）
            if (dpr === 1) dpr = 2;

            canvas.width = W * dpr;
            canvas.height = H * dpr;

            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        }
    }
    onMove(event: MouseEvent) {
        if (!this.view) return;
        const x = (event.clientX / window.innerWidth) * 2 - 1;
        const y = (1 - event.clientY / window.innerHeight) * 2 - 1;
        this.view.mouseUpdate(x, y);
    }
    onToutch(event: TouchEvent) {
        if (!this.view) return;
        const x = (event.touches[0].clientX / window.innerWidth) * 2 - 1;
        const y = (1 - event.touches[0].clientY / window.innerHeight) * 2 - 1;
        this.view.mouseUpdate(x, y);
    }
    chMap(text: IPhrase[]) {
        const c = text.map((t) => t.text).join('');
        const dedup = (array: string) => [...new Set([...array])];
        return dedup(c).map((c, i) => ({ id: i, c: c }));
    }
    convert(text: IPhrase[], ch: { id: number; c: string }[]) {
        const chars: Char[] = [];
        text.forEach((phrase, k) => {
            let j = 0;
            const nChar = phrase.text.length;

            const bData = block.phrase[k];
            const animation = block.animation[k];
            let bIndex = 0;
            let startIndex = bData[0];
            let endIndex = bData.findIndex((b) => b === startIndex + 1) - 1;
            if (endIndex === -2) endIndex = bData.length - 1;
            let bStart = phrase.startTime;
            let bEnd = phrase.children[endIndex].endTime;
            let bRnd = Math.random();
            let bLen = phrase.children
                .slice(0, endIndex + 1)
                .map((b) => b.text)
                .join('').length;
            phrase.children.forEach((word, i) => {
                if (startIndex !== bData[i]) {
                    startIndex = bData[i];
                    let endIndex =
                        bData.findIndex((b) => b === startIndex + 1) - 1;
                    if (endIndex === -2) endIndex = bData.length - 1;
                    bStart = phrase.children[i].startTime;
                    bEnd = phrase.children[endIndex].endTime;
                    bRnd = Math.random();
                    bLen = phrase.children
                        .slice(i, endIndex + 1)
                        .map((b) => b.text)
                        .join('').length;
                    bIndex = 0;
                }

                word.children.forEach((char, l) => {
                    chars.push({
                        cIndex: ch.findIndex((c) => c.c === char.text),
                        cStart: char.startTime,
                        cEnd: char.endTime,
                        pcIndex: j,
                        pbIndex: bData[i] - bData[0],
                        c: char.text,
                        pStart: phrase.startTime,
                        pEnd: phrase.endTime,
                        animation: animation[i],
                        pLength: nChar,
                        bIndex: bIndex,
                        bEnd: bEnd,
                        bStart: bStart,
                        bLength: bLen,
                    });
                    j++;
                    bIndex++;
                });
            });
        });
        return chars;
    }
}

const m = new Main();
