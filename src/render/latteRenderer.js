// latteRenderer.js
// 將流體純量場上傳成貼圖，交給 shader 以 3D 視角畫出整杯咖啡。
// 也負責 canvas ↔ 模擬座標的換算（會考慮杯子傾斜與液面晃動）。
// 沒有 WebGL 時退回簡易的 Canvas 2D 繪製（不傾斜）。

import { vertexSource, fragmentSource } from "./shaders.js";
import {
  RIM_INNER,
  RIM_OUTER,
  EXTENT,
  makeView,
  rotationUniform,
  canvasToLiquid,
  liquidToCanvas,
  rimToCanvas,
} from "./geometry.js";

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log);
  }
  return shader;
}

export class LatteRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.fill = 0.75;
    this.simRadius = 0.48;
    this.tilt = { ax: 0, ay: 0, wx: 0, wy: 0 };
    this.view = makeView({ fill: this.fill });
    this.pixels = null;
    this.texW = 0;
    this.texH = 0;
    this.gl = null;
    try {
      this.initGL();
    } catch (err) {
      console.warn("WebGL unavailable, falling back to 2D", err);
      this.gl = null;
      this.ctx = canvas.getContext("2d");
    }
  }

  get isWebGL() {
    return Boolean(this.gl);
  }

  initGL() {
    const gl = this.canvas.getContext("webgl", {
      premultipliedAlpha: true,
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true, // 分享卡片需要直接讀取畫面
    });
    if (!gl) throw new Error("no webgl");
    this.gl = gl;

    const program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program));
    }
    gl.useProgram(program);
    this.program = program;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const aPos = gl.getAttribLocation(program, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.uniforms = {};
    for (const name of [
      "uField",
      "uTexSize",
      "uRes",
      "uTime",
      "uRot",
      "uLiquidN",
      "uDepth",
      "uSimR",
      "uPour",
      "uGlow",
    ]) {
      this.uniforms[name] = gl.getUniformLocation(program, name);
    }
    gl.uniform1i(this.uniforms.uField, 0);
  }

  resize(cssSize, dpr) {
    const px = Math.round(cssSize * Math.min(dpr, 2));
    if (this.canvas.width !== px) {
      this.canvas.width = px;
      this.canvas.height = px;
    }
    if (this.gl) this.gl.viewport(0, 0, px, px);
  }

  // 每幀更新視角（傾斜角、液面晃動、液位）
  setTilt(tilt) {
    this.tilt = tilt;
    this.view = makeView({ ...tilt, fill: this.fill });
  }

  // canvas uv（0–1，y 向上）↔ 模擬座標
  canvasToSim(u, v) {
    const p = canvasToLiquid(this.view, u, v);
    const k = this.simRadius / RIM_INNER;
    return { x: 0.5 + p.x * k, y: 0.5 + p.y * k };
  }

  simToCanvas(x, y) {
    const k = RIM_INNER / this.simRadius;
    return liquidToCanvas(this.view, (x - 0.5) * k, (y - 0.5) * k);
  }

  rimToCanvas(theta, r = RIM_OUTER) {
    return rimToCanvas(this.view, theta, r);
  }

  upload(fluid) {
    this.simRadius = fluid.radius;
    const w = fluid.numX;
    const h = fluid.numY;
    if (!this.pixels || this.texW !== w || this.texH !== h) {
      this.pixels = new Uint8Array(w * h * 4);
      this.texW = w;
      this.texH = h;
    }
    fluid.fillGhosts(fluid.foam);
    fluid.fillGhosts(fluid.tint);
    fluid.fillGhosts(fluid.crema);
    const { foam, tint, crema } = fluid;
    const px = this.pixels;
    const n = fluid.numY;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const c = i * n + j;
        const o = (j * w + i) * 4;
        px[o] = foam[c] * 255;
        px[o + 1] = tint[c] * 255;
        px[o + 2] = crema[c] * 255;
        px[o + 3] = 255;
      }
    }
  }

  draw({ time = 0, pour = null, glow = 0 } = {}) {
    if (!this.pixels) return;
    if (!this.gl) {
      this.draw2D();
      return;
    }
    const gl = this.gl;
    const U = this.uniforms;
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.texW,
      this.texH,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.pixels
    );
    gl.uniform2f(U.uTexSize, this.texW, this.texH);
    gl.uniform2f(U.uRes, this.canvas.width, this.canvas.height);
    gl.uniform1f(U.uTime, time);
    gl.uniformMatrix3fv(U.uRot, false, rotationUniform(this.view));
    gl.uniform3f(U.uLiquidN, ...this.view.normal);
    gl.uniform1f(U.uDepth, this.view.depth);
    gl.uniform1f(U.uSimR, this.simRadius);
    gl.uniform1f(U.uGlow, glow);
    if (pour) {
      gl.uniform4f(U.uPour, pour.x, pour.y, pour.height, pour.active ? 1 : 0);
    } else {
      gl.uniform4f(U.uPour, -1, -1, 1, 0);
    }
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // 以指定解析度另外渲染一張畫面（分享卡用），完成後恢復原尺寸
  snapshot(px, drawOptions) {
    const prev = this.canvas.width;
    const prevTilt = this.tilt;
    this.setTilt({ ax: 0, ay: 0, wx: 0, wy: 0 });
    this.resize(px, 1);
    this.draw(drawOptions);
    const copy = document.createElement("canvas");
    copy.width = copy.height = px;
    copy.getContext("2d").drawImage(this.canvas, 0, 0);
    this.resize(prev, 1);
    this.setTilt(prevTilt);
    this.draw(drawOptions);
    return copy;
  }

  // 簡易備援：逐格著色後縮放到畫面
  draw2D() {
    const { ctx, canvas } = this;
    if (!this.buffer2D || this.buffer2D.width !== this.texW) {
      this.buffer2D = document.createElement("canvas");
      this.buffer2D.width = this.texW;
      this.buffer2D.height = this.texH;
      this.bufferCtx = this.buffer2D.getContext("2d");
      this.image2D = this.bufferCtx.createImageData(this.texW, this.texH);
    }
    const out = this.image2D.data;
    const px = this.pixels;
    const w = this.texW;
    const h = this.texH;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        const src = (j * w + i) * 4;
        const dst = ((h - 1 - j) * w + i) * 4;
        const foam = Math.min(1, Math.max(0, (px[src] / 255 - 0.3) * 5));
        const tint = px[src + 1] / 255;
        const crema = px[src + 2] / 255;
        let r = 43 + (150 - 43) * crema;
        let g = 18 + (85 - 18) * crema;
        let b = 7 + (36 - 7) * crema;
        r += (205 - r) * tint * 0.9;
        g += (150 - g) * tint * 0.9;
        b += (100 - b) * tint * 0.9;
        out[dst] = r + (252 - r) * foam;
        out[dst + 1] = g + (246 - g) * foam;
        out[dst + 2] = b + (235 - b) * foam;
        out[dst + 3] = 255;
      }
    }
    this.bufferCtx.putImageData(this.image2D, 0, 0);

    const W = canvas.width;
    ctx.clearRect(0, 0, W, W);
    ctx.save();
    const scale = W / (2 * EXTENT);
    ctx.beginPath();
    ctx.arc(W / 2, W / 2, scale * RIM_OUTER, 0, Math.PI * 2);
    ctx.fillStyle = "#ece7df";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W / 2, W / 2, scale * RIM_INNER, 0, Math.PI * 2);
    ctx.clip();
    const size = (scale * RIM_INNER) / this.simRadius;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.buffer2D, W / 2 - size / 2, W / 2 - size / 2, size, size);
    ctx.restore();
  }
}
