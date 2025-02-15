// 設定流體模擬參數
const canvas = document.getElementById("fluidCanvas");
const ctx = canvas.getContext("2d");

// 設定畫布大小
canvas.width = 300;
canvas.height = 300;

const gridSizeX = 50; // X方向的網格數量
const gridSizeY = 50; // Y方向的網格數量
const cellSize = canvas.width / gridSizeX; // 計算每個網格的大小

const fluid = new Fluid(1.0, gridSizeX, gridSizeY, cellSize);

// 初始化杯子邊緣障礙物
for (let i = 0; i < gridSizeX + 2; i++) {
  for (let j = 0; j < gridSizeY + 2; j++) {
    let centerX = (gridSizeX + 2) / 2;
    let centerY = (gridSizeY + 2) / 2;
    let radius = gridSizeX / 2 - 2; // 確保杯子邊界
    let distance = Math.sqrt((i - centerX) ** 2 + (j - centerY) ** 2);
    if (distance >= radius) {
      fluid.s[i * fluid.numY + j] = 0.0; // 設定為障礙物
    }
  }
}

// 初始化流體從杯子頂部中央區域開始流動
const startX = Math.floor(gridSizeX / 2);
for (let j = 1; j <= 3; j++) {
  // 讓流體從最上面3層開始
  fluid.m[startX * fluid.numY + j] = 1.0; // 設定密度
  fluid.v[startX * fluid.numY + j] = 1.0; // 設定初始向下速度
}

// 繪製流體
function drawFluid() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 1; i < gridSizeX + 1; i++) {
    for (let j = 1; j < gridSizeY + 1; j++) {
      let density = fluid.m[i * fluid.numY + j];
      if (fluid.s[i * fluid.numY + j] === 0.0) {
        ctx.fillStyle = "#654321"; // 杯子邊緣顏色
      } else {
        let alpha = Math.min(density, 1.0);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`; // 流體顏色
      }
      ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
    }
  }
}

// 更新動畫
function update() {
  fluid.integrate(0.01, 10); // 模擬重力
  fluid.solveIncompressibility(10, 0.01);
  fluid.advectVel(0.01);
  fluid.advectSmoke(0.01);
  drawFluid();
  requestAnimationFrame(update);
}

// 啟動模擬
update();
