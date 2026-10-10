// tilt.js
// 杯子的傾斜：桌機跟著滑鼠位置、手機跟著陀螺儀，沒有輸入時輕輕呼吸般擺動。
// 液面用一個彈簧—阻尼系統落後於杯子的動作，產生晃動；晃動的速度另外交給流體，
// 讓奶泡花紋真的被液面帶著走。

const MAX_TILT = 0.07; // 最大傾斜（弧度，約 4°）：只是氛圍，不干擾作畫
const SPRING = 38; // 液面回正的彈性
const DAMP = 3.2; // 液面晃動的阻尼
const KICK = 0.5; // 杯子轉動傳給液面的力道

export class TiltController {
  constructor() {
    this.target = { x: 0, y: 0 };
    this.ax = 0;
    this.ay = 0;
    this.vax = 0;
    this.vay = 0;
    this.wx = 0;
    this.wy = 0;
    this.wvx = 0;
    this.wvy = 0;
    this.time = 0;
    this.lastInput = -Infinity;
    this.gyroBase = null;
    this.enabled = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.strength = 1; // 傾斜幅度倍率（出杯時減弱）
    this.frozen = false; // 作畫中：杯子停在當下的角度不動

    window.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      this.target.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.target.y = (e.clientY / window.innerHeight) * 2 - 1;
      this.lastInput = this.time;
    });
    document.documentElement.addEventListener("mouseleave", () => {
      this.target.x = 0;
      this.target.y = 0;
    });
    window.addEventListener("deviceorientation", (e) => this.onOrientation(e));
    // iOS 需要在使用者手勢中請求陀螺儀權限
    const ask = () => {
      const DOE = window.DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === "function") {
        DOE.requestPermission().catch(() => {});
      }
      window.removeEventListener("touchend", ask);
    };
    window.addEventListener("touchend", ask);
  }

  onOrientation(e) {
    if (e.beta === null || e.gamma === null) return;
    // 以第一次讀到的角度為基準，只看相對變化
    if (!this.gyroBase) this.gyroBase = { beta: e.beta, gamma: e.gamma };
    const clamp = (v) => Math.max(-1, Math.min(1, v));
    this.target.x = clamp((e.gamma - this.gyroBase.gamma) / 22);
    this.target.y = clamp((e.beta - this.gyroBase.beta) / 22);
    this.lastInput = this.time;
  }

  update(dt) {
    this.time += dt;
    if (!this.enabled) return this.state;

    // 一段時間沒有輸入時，杯子緩慢擺動
    let tx = this.target.x;
    let ty = this.target.y;
    if (this.time - this.lastInput > 4) {
      tx = Math.sin(this.time * 0.5) * 0.25;
      ty = Math.cos(this.time * 0.37) * 0.2;
    }

    const goalY = tx * MAX_TILT * this.strength; // 左右 → 繞 y 軸
    const goalX = ty * MAX_TILT * this.strength; // 上下 → 繞 x 軸
    // 作畫時凍結；放開後以較慢的速度回到跟隨狀態
    const k = this.frozen ? 0 : Math.min(1, dt * 2.5);
    const nax = this.ax + (goalX - this.ax) * k;
    const nay = this.ay + (goalY - this.ay) * k;
    const vax = (nax - this.ax) / dt;
    const vay = (nay - this.ay) / dt;
    // 角加速度推動液面
    const accX = (vax - this.vax) / dt;
    const accY = (vay - this.vay) / dt;
    this.ax = nax;
    this.ay = nay;
    this.vax = vax;
    this.vay = vay;

    // 液面晃動（本地座標的法向量偏移）
    this.wvx += (-SPRING * this.wx - DAMP * this.wvx - KICK * accY * 0.25) * dt;
    this.wvy += (-SPRING * this.wy - DAMP * this.wvy + KICK * accX * 0.25) * dt;
    this.wx += this.wvx * dt;
    this.wy += this.wvy * dt;
    const lim = 0.12;
    this.wx = Math.max(-lim, Math.min(lim, this.wx));
    this.wy = Math.max(-lim, Math.min(lim, this.wy));
    return this.state;
  }

  get state() {
    return { ax: this.ax, ay: this.ay, wx: this.wx, wy: this.wy };
  }

  // 液面晃動的速度（給流體推動花紋用）
  get slosh() {
    return { x: this.wvx, y: this.wvy };
  }
}
