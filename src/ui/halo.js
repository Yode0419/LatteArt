// halo.js
// 出杯效果：一道金色光環沿杯緣畫一圈，筆尖灑出細碎的金色粒子，
// 畫完後光環保持微微流動，偶爾有粒子緩緩飄起。
// 光環跟著 3D 杯緣投影，杯子傾斜時也會一起變成橢圓。

const DRAW_SECONDS = 1.5;
const RING_R = 1.075; // 光環半徑（杯緣外側一點）

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class ServeHalo {
  constructor(canvas, renderer) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.renderer = renderer;
    this.particles = [];
    this.active = false;
    this.t = 0;
    this.fade = 0;
    this.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  resize(px) {
    this.canvas.width = px;
    this.canvas.height = px;
  }

  play() {
    this.active = true;
    this.t = this.reduced ? DRAW_SECONDS : 0;
    this.particles.length = 0;
  }

  reset() {
    this.active = false;
    this.particles.length = 0;
    this.fade = 0;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  point(theta) {
    const c = this.renderer.rimToCanvas(theta, RING_R);
    const W = this.canvas.width;
    return [c.u * W, (1 - c.v) * W];
  }

  emit(x, y, speed, count) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.3 + Math.random());
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - speed * 0.4,
        life: 0,
        max: 0.6 + Math.random() * 0.9,
        size: 0.6 + Math.random() * 1.6,
      });
    }
  }

  update(dt) {
    const { ctx, canvas } = this;
    const W = canvas.width;
    if (!this.active && this.particles.length === 0 && this.fade <= 0) return;
    ctx.clearRect(0, 0, W, W);
    this.fade += ((this.active ? 1 : 0) - this.fade) * Math.min(1, dt * 4);
    const unit = W / 400; // 依畫布大小調整線寬與粒子大小

    if (this.active || this.fade > 0.01) {
      this.t += dt;
      const progress = easeInOut(Math.min(1, this.t / DRAW_SECONDS));
      const start = Math.PI / 2; // 從杯子正上方開始，順時針畫
      const end = start - progress * Math.PI * 2;
      const steps = Math.max(2, Math.ceil(progress * 160));

      // 光環本體：外層柔光 + 內層亮線
      ctx.save();
      ctx.globalAlpha = this.fade;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const path = new Path2D();
      for (let i = 0; i <= steps; i++) {
        const [x, y] = this.point(start + (end - start) * (i / steps));
        if (i === 0) path.moveTo(x, y);
        else path.lineTo(x, y);
      }
      ctx.shadowColor = "rgba(255, 196, 110, 0.9)";
      ctx.shadowBlur = 18 * unit;
      ctx.strokeStyle = "rgba(232, 178, 92, 0.55)";
      ctx.lineWidth = 5 * unit;
      ctx.stroke(path);
      ctx.shadowBlur = 6 * unit;
      ctx.strokeStyle = "rgba(255, 228, 170, 0.95)";
      ctx.lineWidth = 1.6 * unit;
      ctx.stroke(path);

      // 畫完後一道光沿著光環流動
      if (progress >= 1) {
        const sweep = start - ((this.t - DRAW_SECONDS) * 0.9) % (Math.PI * 2);
        const glint = new Path2D();
        for (let i = 0; i <= 24; i++) {
          const [x, y] = this.point(sweep + (i / 24) * 0.7);
          if (i === 0) glint.moveTo(x, y);
          else glint.lineTo(x, y);
        }
        ctx.shadowBlur = 14 * unit;
        ctx.strokeStyle = "rgba(255, 244, 214, 0.9)";
        ctx.lineWidth = 2.4 * unit;
        ctx.stroke(glint);
      }
      ctx.restore();

      // 粒子：畫圈時從筆尖灑出，之後偶爾沿光環飄起
      if (this.active && !this.reduced) {
        if (progress < 1) {
          const [hx, hy] = this.point(end);
          this.emit(hx, hy, 60 * unit, 3);
        } else if (Math.random() < dt * 10) {
          const [x, y] = this.point(Math.random() * Math.PI * 2);
          this.emit(x, y, 18 * unit, 1);
        }
      }
    }

    // 更新與繪製粒子（加亮混合）
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const alive = [];
    for (const p of this.particles) {
      p.life += dt;
      if (p.life >= p.max) continue;
      p.vx *= 1 - dt * 1.6;
      p.vy = p.vy * (1 - dt * 1.6) - 14 * unit * dt; // 微微上飄
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const k = 1 - p.life / p.max;
      const r = p.size * unit * (0.6 + k);
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      g.addColorStop(0, `rgba(255, 236, 190, ${0.9 * k})`);
      g.addColorStop(0.35, `rgba(240, 180, 90, ${0.45 * k})`);
      g.addColorStop(1, "rgba(240, 160, 80, 0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
      ctx.fill();
      alive.push(p);
    }
    this.particles = alive;
    ctx.restore();
  }
}
