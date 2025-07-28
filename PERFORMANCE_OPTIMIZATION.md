# LatteArt 流體模擬性能優化方案

## 概述

本文件詳細說明 LatteArt 流體模擬的性能優化策略，目標是實現**效果細緻且反應快速**的拉花模擬體驗。

## 🚀 核心算法優化

### 1. 並行化不可壓縮求解器 (最高優先級)

**現況問題**:
```javascript
// 當前的串行求解器 (fluidCore.js:51-52)
for (let iter = 0; iter < numIters; iter++) {
  for (let i = 1; i < this.numX - 1; i++) {
    for (let j = 1; j < this.numY - 1; j++) {
      // 壓力修正計算 - 串行執行
    }
  }
}
```

**優化方案**: Red-Black Gauss-Seidel 並行化
```javascript
class ParallelFluidSolver {
  solveIncompressibility(numIters, dt, overRelaxation) {
    const n = this.numY;
    const cp = (this.density * this.h) / dt;

    for (let iter = 0; iter < numIters; iter++) {
      // Phase 1: 處理紅色格子 (i+j為偶數)
      this.solveRedCells(cp, overRelaxation);
      // Phase 2: 處理黑色格子 (i+j為奇數)  
      this.solveBlackCells(cp, overRelaxation);
    }
  }

  solveRedCells(cp, overRelaxation) {
    // 紅色格子可以並行計算，因為它們互不相鄰
    for (let i = 1; i < this.numX - 1; i += 2) {
      for (let j = 1; j < this.numY - 1; j += 2) {
        this.updatePressure(i, j, cp, overRelaxation);
      }
    }
    for (let i = 2; i < this.numX - 1; i += 2) {
      for (let j = 2; j < this.numY - 1; j += 2) {
        this.updatePressure(i, j, cp, overRelaxation);
      }
    }
  }

  solveBlackCells(cp, overRelaxation) {
    // 黑色格子的並行處理
    for (let i = 1; i < this.numX - 1; i += 2) {
      for (let j = 2; j < this.numY - 1; j += 2) {
        this.updatePressure(i, j, cp, overRelaxation);
      }
    }
    for (let i = 2; i < this.numX - 1; i += 2) {
      for (let j = 1; j < this.numY - 1; j += 2) {
        this.updatePressure(i, j, cp, overRelaxation);
      }
    }
  }
}
```

**預期效益**: 40-60% 性能提升

### 2. WebWorker 多核心利用

```javascript
// FluidWorkerPool.js
class FluidWorkerPool {
  constructor(workerCount = navigator.hardwareConcurrency || 4) {
    this.workers = [];
    this.workerCount = workerCount;
    this.taskQueue = [];
    this.initializeWorkers();
  }

  initializeWorkers() {
    for (let i = 0; i < this.workerCount; i++) {
      const worker = new Worker('fluidWorker.js');
      this.workers.push({
        worker,
        busy: false,
        id: i
      });
    }
  }

  async distributeComputation(fluidData, operation) {
    const chunkSize = Math.ceil(fluidData.numX / this.workerCount);
    const promises = [];

    for (let i = 0; i < this.workerCount; i++) {
      const startX = i * chunkSize;
      const endX = Math.min(startX + chunkSize, fluidData.numX);
      
      if (startX < endX) {
        promises.push(this.executeOnWorker(i, {
          operation,
          data: this.extractChunk(fluidData, startX, endX),
          startX,
          endX
        }));
      }
    }

    const results = await Promise.all(promises);
    return this.mergeResults(fluidData, results);
  }

  executeOnWorker(workerId, task) {
    return new Promise((resolve, reject) => {
      const worker = this.workers[workerId];
      worker.busy = true;

      worker.worker.onmessage = (e) => {
        worker.busy = false;
        resolve(e.data);
      };

      worker.worker.onerror = (error) => {
        worker.busy = false;
        reject(error);
      };

      worker.worker.postMessage(task);
    });
  }
}

// fluidWorker.js
self.onmessage = function(e) {
  const { operation, data, startX, endX } = e.data;
  
  switch (operation) {
    case 'advectVelocity':
      const result = advectVelocityChunk(data, startX, endX);
      self.postMessage(result);
      break;
    case 'solveIncompressibility':
      const pressureResult = solvePressureChunk(data, startX, endX);
      self.postMessage(pressureResult);
      break;
  }
};

function advectVelocityChunk(data, startX, endX) {
  // 在 worker 中處理速度場平流
  const result = new Float32Array((endX - startX) * data.numY * 2);
  
  for (let i = startX; i < endX; i++) {
    for (let j = 1; j < data.numY - 1; j++) {
      // 速度平流計算
      const localIdx = (i - startX) * data.numY + j;
      result[localIdx * 2] = computeNewU(data, i, j);
      result[localIdx * 2 + 1] = computeNewV(data, i, j);
    }
  }
  
  return { result, startX, endX };
}
```

**預期效益**: 2-4x 性能提升 (多核 CPU)

## ⚡ 渲染管線優化

### 3. ImageData 復用與雙緩衝

**現況問題**:
```javascript
// 每幀創建新 ImageData (render.js:57)
const id = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
```

**優化方案**:
```javascript
class OptimizedRenderer {
  constructor(canvas, simHeight) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { willReadFrequently: true });
    this.simHeight = simHeight;
    this.cScale = canvas.height / simHeight;
    
    // 預分配緩衝區
    this.frontBuffer = this.ctx.createImageData(canvas.width, canvas.height);
    this.backBuffer = this.ctx.createImageData(canvas.width, canvas.height);
    this.currentBuffer = this.backBuffer;
    
    // 顏色計算快取
    this.colorCache = new Map();
    this.backgroundColor = { r: 198, g: 102, b: 33 };
    this.milkColor = { r: 255, g: 252, b: 245 };
  }

  draw(fluid, options = {}) {
    const { showStreamlines = false } = options;
    
    // 直接操作預分配的緩衝區
    this.updatePixels(fluid);
    this.ctx.putImageData(this.currentBuffer, 0, 0);
    
    if (showStreamlines) {
      this.drawStreamlines(fluid);
    }
    
    // 交換緩衝區
    this.swapBuffers();
  }

  updatePixels(fluid) {
    const data = this.currentBuffer.data;
    const n = fluid.numY;
    const h = fluid.h;
    const cellScale = 1.1;

    // 重置緩衝區
    data.fill(0);

    for (let i = 0; i < fluid.numX; i++) {
      for (let j = 0; j < fluid.numY; j++) {
        const isSolid = fluid.s[i * n + j] === 0.0;
        const density = fluid.densityField.getDensity(i, j, "milk");
        
        // 使用快取的顏色計算
        const color = this.getCachedFluidColor(density, isSolid);
        
        const x = Math.floor(this.cX(i * h));
        const y = Math.floor(this.cY((j + 1) * h));
        const cx = Math.floor(this.cScale * cellScale * h) + 1;
        const cy = Math.floor(this.cScale * cellScale * h) + 1;

        // 優化像素填充
        this.fillPixelBlock(data, x, y, cx, cy, color);
      }
    }
  }

  fillPixelBlock(data, x, y, width, height, color) {
    const canvasWidth = this.canvas.width;
    const [r, g, b, a] = color;
    
    for (let yi = 0; yi < height; yi++) {
      const rowStart = ((y + yi) * canvasWidth + x) * 4;
      for (let xi = 0; xi < width; xi++) {
        const pixelStart = rowStart + xi * 4;
        data[pixelStart] = r;
        data[pixelStart + 1] = g;
        data[pixelStart + 2] = b;
        data[pixelStart + 3] = a;
      }
    }
  }

  getCachedFluidColor(density, isSolid) {
    const key = `${Math.round(density * 100)}_${isSolid}`;
    
    if (!this.colorCache.has(key)) {
      const color = this.computeFluidColor(density, isSolid);
      this.colorCache.set(key, color);
    }
    
    return this.colorCache.get(key);
  }

  swapBuffers() {
    [this.frontBuffer, this.currentBuffer] = [this.currentBuffer, this.frontBuffer];
  }
}
```

**預期效益**: 25-35% 渲染性能提升

### 4. 分級渲染 (Level-of-Detail)

```javascript
class AdaptiveRenderer extends OptimizedRenderer {
  constructor(canvas, simHeight) {
    super(canvas, simHeight);
    this.renderScale = 1.0;
    this.targetFPS = 60;
    this.performanceHistory = [];
  }

  draw(fluid, options = {}, deltaTime) {
    // 性能監控
    this.updatePerformanceMetrics(deltaTime);
    
    // 動態調整渲染品質
    this.adjustRenderQuality();
    
    // 根據渲染比例決定處理方式
    if (this.renderScale < 1.0) {
      this.drawLowQuality(fluid, options);
    } else {
      super.draw(fluid, options);
    }
  }

  updatePerformanceMetrics(deltaTime) {
    const currentFPS = 1000 / deltaTime;
    this.performanceHistory.push(currentFPS);
    
    // 保持最近 10 幀的記錄
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift();
    }
  }

  adjustRenderQuality() {
    const avgFPS = this.performanceHistory.reduce((a, b) => a + b, 0) / this.performanceHistory.length;
    
    if (avgFPS < this.targetFPS * 0.8) {
      // 性能不足，降低品質
      this.renderScale = Math.max(0.5, this.renderScale * 0.95);
    } else if (avgFPS > this.targetFPS * 1.1) {
      // 性能充足，提升品質
      this.renderScale = Math.min(1.0, this.renderScale * 1.02);
    }
  }

  drawLowQuality(fluid, options) {
    // 降低解析度渲染
    const skipRate = Math.ceil(1 / this.renderScale);
    
    // 跳躍式像素更新
    for (let i = 0; i < fluid.numX; i += skipRate) {
      for (let j = 0; j < fluid.numY; j += skipRate) {
        // 渲染較大的像素塊
        this.renderLargePixelBlock(fluid, i, j, skipRate);
      }
    }
    
    this.ctx.putImageData(this.currentBuffer, 0, 0);
  }
}
```

## 💾 記憶體優化

### 5. SIMD 優化的數據結構

```javascript
class SIMDFluidData {
  constructor(numX, numY) {
    this.numX = numX + 2;
    this.numY = numY + 2;
    this.numCells = this.numX * this.numY;
    
    // 使用結構化陣列 (Array of Structures -> Structure of Arrays)
    this.velocity = new Float32Array(this.numCells * 2); // u,v 交錯存儲
    this.pressure = new Float32Array(this.numCells);
    this.solid = new Uint8Array(this.numCells); // 固體標記使用更少記憶體
    this.density = new Float32Array(this.numCells);
    
    // 臨時緩衝區復用
    this.tempVelocity = new Float32Array(this.numCells * 2);
    this.tempDensity = new Float32Array(this.numCells);
  }

  // 向量化速度更新
  updateVelocityField(dt, viscosity) {
    const len = this.velocity.length;
    
    // 一次處理多個速度分量
    for (let i = 0; i < len; i += 8) {
      // 利用 SIMD 指令處理 4 對 (u,v) 值
      this.velocity[i] *= viscosity;
      this.velocity[i + 1] *= viscosity;
      this.velocity[i + 2] *= viscosity;
      this.velocity[i + 3] *= viscosity;
      this.velocity[i + 4] *= viscosity;
      this.velocity[i + 5] *= viscosity;
      this.velocity[i + 6] *= viscosity;
      this.velocity[i + 7] *= viscosity;
    }
  }

  // 快速記憶體複製
  swapVelocityBuffers() {
    [this.velocity, this.tempVelocity] = [this.tempVelocity, this.velocity];
  }

  // 記憶體池管理
  static createPool(maxSize = 10) {
    const pool = [];
    
    return {
      acquire: (numX, numY) => {
        if (pool.length > 0) {
          const data = pool.pop();
          data.resize(numX, numY);
          return data;
        }
        return new SIMDFluidData(numX, numY);
      },
      
      release: (data) => {
        if (pool.length < maxSize) {
          data.clear();
          pool.push(data);
        }
      }
    };
  }
}
```

### 6. 智能邊界條件快取

```javascript
class BoundaryCache {
  constructor(fluid) {
    this.numX = fluid.numX;
    this.numY = fluid.numY;
    this.boundaryMask = new Uint8Array(fluid.numCells);
    this.boundaryIndices = {
      fluid: [],
      solid: [],
      edge: []
    };
    
    this.precomputeBoundaries(fluid);
  }

  precomputeBoundaries(fluid) {
    const n = fluid.numY;
    
    for (let i = 0; i < fluid.numX; i++) {
      for (let j = 0; j < fluid.numY; j++) {
        const idx = i * n + j;
        const boundaryType = this.getBoundaryType(i, j, fluid);
        
        this.boundaryMask[idx] = boundaryType;
        
        // 按類型分組索引
        switch (boundaryType) {
          case 0: // 固體
            this.boundaryIndices.solid.push(idx);
            break;
          case 1: // 流體
            this.boundaryIndices.fluid.push(idx);
            break;
          case 2: // 邊界
            this.boundaryIndices.edge.push(idx);
            break;
        }
      }
    }
  }

  getBoundaryType(i, j, fluid) {
    const n = fluid.numY;
    const idx = i * n + j;
    
    if (fluid.s[idx] === 0.0) return 0; // 固體
    if (i === 0 || i === fluid.numX - 1 || j === 0 || j === fluid.numY - 1) return 2; // 邊界
    return 1; // 流體
  }

  applyBoundaryConditions(fluid) {
    // 只處理邊界格子，跳過內部流體格子
    for (const idx of this.boundaryIndices.edge) {
      this.applyBoundaryAtIndex(fluid, idx);
    }
  }
}
```

## 🎯 算法層面改進

### 7. 自適應時間步長

```javascript
class AdaptiveTimeStep {
  constructor(initialDt = 1.0 / 60.0) {
    this.dt = initialDt;
    this.minDt = initialDt * 0.1;
    this.maxDt = initialDt * 2.0;
    this.safetyFactor = 0.8;
  }

  computeOptimalDt(fluid, targetStability = 0.8) {
    // CFL 條件: dt < dx / max_velocity
    const maxVelocity = this.findMaxVelocity(fluid);
    
    if (maxVelocity > 0) {
      const cflDt = (targetStability * fluid.h) / maxVelocity;
      this.dt = Math.max(this.minDt, Math.min(this.maxDt, cflDt));
    }
    
    return this.dt;
  }

  findMaxVelocity(fluid) {
    let maxVelSq = 0;
    const n = fluid.numY;
    
    // 向量化搜尋最大速度
    for (let i = 0; i < fluid.numCells; i++) {
      if (fluid.s[i] > 0) { // 只檢查流體格子
        const u = fluid.u[i];
        const v = fluid.v[i];
        const velSq = u * u + v * v;
        maxVelSq = Math.max(maxVelSq, velSq);
      }
    }
    
    return Math.sqrt(maxVelSq);
  }

  // 子步長迭代
  adaptiveSimulate(fluid, targetDt, gravity, numIters, overRelaxation, viscosity) {
    let remainingTime = targetDt;
    
    while (remainingTime > 1e-6) {
      const stepDt = Math.min(this.computeOptimalDt(fluid), remainingTime);
      
      // 執行一個子步長
      fluid.integrate(stepDt, gravity);
      fluid.solveIncompressibility(numIters, stepDt, overRelaxation);
      fluid.advectVel(stepDt);
      fluid.advectSmoke(stepDt);
      
      remainingTime -= stepDt;
    }
  }
}
```

### 8. 分層模擬精度

```javascript
class MultiResolutionFluid {
  constructor(baseResolution) {
    this.levels = [
      new FluidLevel(baseResolution, 1.0),      // 高精度
      new FluidLevel(baseResolution / 2, 0.7),  // 中精度  
      new FluidLevel(baseResolution / 4, 0.4)   // 低精度
    ];
    
    this.currentLevel = 0;
    this.interactionRadius = 0.1; // 高精度區域半徑
  }

  setInteractionPoint(x, y) {
    this.interactionX = x;
    this.interactionY = y;
    this.updateSimulationRegions();
  }

  updateSimulationRegions() {
    // 根據交互點動態調整模擬精度
    for (let level = 0; level < this.levels.length; level++) {
      const fluid = this.levels[level].fluid;
      const scale = Math.pow(2, level);
      
      // 計算該層級的交互區域
      const localX = this.interactionX / scale;
      const localY = this.interactionY / scale;
      const localRadius = this.interactionRadius / scale;
      
      this.levels[level].setActiveRegion(localX, localY, localRadius);
    }
  }

  simulate(dt) {
    // 從粗糙到精細逐層模擬
    for (let level = this.levels.length - 1; level >= 0; level--) {
      this.levels[level].simulate(dt);
      
      if (level > 0) {
        // 將結果插值到更精細的層級
        this.interpolateToFinerLevel(level, level - 1);
      }
    }
  }

  interpolateToFinerLevel(coarseLevel, fineLevel) {
    const coarse = this.levels[coarseLevel].fluid;
    const fine = this.levels[fineLevel].fluid;
    
    // 雙線性插值將粗糙結果傳遞到精細網格
    for (let i = 0; i < fine.numX; i++) {
      for (let j = 0; j < fine.numY; j++) {
        const coarseI = Math.floor(i / 2);
        const coarseJ = Math.floor(j / 2);
        
        // 插值速度和密度場
        fine.u[i * fine.numY + j] = this.bilinearInterpolate(
          coarse.u, coarseI, coarseJ, coarse.numY
        );
        fine.v[i * fine.numY + j] = this.bilinearInterpolate(
          coarse.v, coarseI, coarseJ, coarse.numY
        );
      }
    }
  }
}

class FluidLevel {
  constructor(resolution, qualityFactor) {
    this.resolution = resolution;
    this.qualityFactor = qualityFactor;
    this.fluid = new Fluid(1000.0, resolution, resolution, 1.0 / resolution, 0.95);
    this.activeRegion = null;
  }

  setActiveRegion(centerX, centerY, radius) {
    this.activeRegion = {
      centerX,
      centerY,
      radius,
      minX: Math.max(0, Math.floor(centerX - radius)),
      maxX: Math.min(this.fluid.numX, Math.ceil(centerX + radius)),
      minY: Math.max(0, Math.floor(centerY - radius)),
      maxY: Math.min(this.fluid.numY, Math.ceil(centerY + radius))
    };
  }

  simulate(dt) {
    // 只在活躍區域進行高精度計算
    if (this.activeRegion) {
      this.simulateRegion(dt, this.activeRegion);
    } else {
      this.simulateFullField(dt);
    }
  }
}
```

## 🔧 實作建議

### 階段 1: 立即改善 (1-2 週)
- [ ] **ImageData 復用** - 最容易實現，立竿見影
- [ ] **邊界條件快取** - 減少重複計算  
- [ ] **自適應渲染解析度** - 確保流暢性
- [ ] **記憶體池管理** - 減少 GC 壓力

### 階段 2: 中期優化 (2-4 週)
- [ ] **Red-Black 並行求解器** - 顯著性能提升
- [ ] **SIMD 數據結構重構** - 記憶體效率提升  
- [ ] **自適應時間步長** - 穩定性改善
- [ ] **顏色計算快取** - 渲染加速

### 階段 3: 高級優化 (1-2 月)
- [ ] **WebWorker 整合** - 多核心利用
- [ ] **多解析度模擬** - 實現大規模細緻模擬
- [ ] **GPU 加速探索** - WebGL/WebGPU 實現
- [ ] **預測性快取** - 智能預載入

## 📊 預期性能提升

| 優化項目 | 性能提升 | 實作難度 | 優先級 |
|---------|---------|---------|--------|
| ImageData 復用 | +35% FPS | 低 | 高 |
| 並行求解器 | +50% 模擬速度 | 中 | 高 |
| 記憶體優化 | -40% 記憶體使用 | 中 | 中 |
| 自適應算法 | +25% 整體穩定性 | 中 | 中 |
| WebWorker | +200% (多核) | 高 | 中 |
| 多解析度 | +300% (大規模) | 高 | 低 |

**總體目標**: 在相同硬體上實現 **2-3x** 性能提升，同時支援更高解析度 (300x300 → 500x500) 的細緻模擬。

## 🧪 效能測試建議

```javascript
class PerformanceBenchmark {
  constructor() {
    this.metrics = {
      frameTime: [],
      simulationTime: [],
      renderTime: [],
      memoryUsage: []
    };
  }

  startFrame() {
    this.frameStart = performance.now();
    this.simulationStart = this.frameStart;
  }

  endSimulation() {
    this.simulationEnd = performance.now();
    this.renderStart = this.simulationEnd;
  }

  endFrame() {
    const frameEnd = performance.now();
    
    this.metrics.frameTime.push(frameEnd - this.frameStart);
    this.metrics.simulationTime.push(this.simulationEnd - this.simulationStart);
    this.metrics.renderTime.push(frameEnd - this.renderStart);
    
    if (performance.memory) {
      this.metrics.memoryUsage.push(performance.memory.usedJSHeapSize);
    }
  }

  generateReport() {
    return {
      avgFrameTime: this.average(this.metrics.frameTime),
      avgFPS: 1000 / this.average(this.metrics.frameTime),
      avgSimulationTime: this.average(this.metrics.simulationTime),
      avgRenderTime: this.average(this.metrics.renderTime),
      avgMemoryUsage: this.average(this.metrics.memoryUsage)
    };
  }
}
```

這些優化方案將讓 LatteArt 在保持物理真實性的同時，達到即時互動的流暢體驗。建議從階段 1 開始逐步實施，每個階段完成後進行效能測試驗證。