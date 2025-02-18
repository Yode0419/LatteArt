export class DensityField {
  constructor(numX, numY) {
    this.numX = numX + 2;
    this.numY = numY + 2;
    this.numCells = this.numX * this.numY;

    // 初始化密度場數組
    this.densities = new Array(this.numCells);
    for (let i = 0; i < this.numCells; i++) {
      this.densities[i] = {
        milk: 0.0, // 初始為無牛奶
        // 之後要加入的其他流體，例如：
        // chocolate: 0.0,  // 巧克力
        // caramel: 0.0,    // 焦糖
      };
    }
  }

  getDensities(i, j) {
    return this.densities[i * this.numY + j];
  }

  setDensity(i, j, fluidType, value) {
    this.densities[i * this.numY + j][fluidType] = value;
  }

  getDensity(i, j, fluidType) {
    return this.densities[i * this.numY + j][fluidType];
  }

  // 修正後的 createTemp 方法
  createTemp() {
    const temp = new Array(this.numCells);
    for (let i = 0; i < this.numCells; i++) {
      temp[i] = {
        coffee: 0.0,
        milk: 0.0,
      };
    }
    return temp;
  }

  // 從臨時數組更新當前密度場
  updateFromTemp(temp) {
    this.densities = temp;
  }

  // 向後兼容的 getter
  get m() {
    const coffeeArray = new Float32Array(this.numCells);
    for (let i = 0; i < this.numCells; i++) {
      coffeeArray[i] = this.densities[i].coffee;
    }
    return coffeeArray;
  }
}
