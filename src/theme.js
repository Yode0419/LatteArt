// 主題定義
export const themes = {
  /* 咖啡主題 */
  coffee: {
    // 顏色系統
    colors: {
      // 背景與基礎顏色
      background: { r: 76, g: 47, b: 39 }, // 深咖啡色背景
      primary: "#4A2925", // 主要元件顏色
      secondary: "#8B5E3C", // 次要元件顏色
      accent: "#D4B59E", // 強調色
      text: "#FFFFFF", // 文字顏色

      // 流體顏色
      fluids: {
        milk: { r: 255, g: 252, b: 245 }, // 牛奶顏色
        chocolate: { r: 65, g: 25, b: 0 }, // 巧克力顏色
        caramel: { r: 193, g: 100, b: 32 }, // 焦糖顏色
      },
    },

    // UI 元件樣式
    components: {
      // 按鈕樣式
      button: {
        backgroundColor: "#4A2925",
        hoverColor: "#613832",
        textColor: "#FFFFFF",
        borderRadius: "4px",
      },
      // 控制面板樣式
      panel: {
        backgroundColor: "#2C1810",
        borderColor: "#8B5E3C",
      },
      // 滑桿樣式
      slider: {
        trackColor: "#8B5E3C",
        thumbColor: "#D4B59E",
      },
    },

    // 圖示路徑
    icons: {
      milk: "/icons/milk-brown.svg",
      chocolate: "/icons/chocolate-brown.svg",
      caramel: "/icons/caramel-brown.svg",
      settings: "/icons/settings-light.svg",
    },
  },

  /* 抹茶主題 */
  matcha: {
    colors: {
      background: { r: 69, g: 91, b: 38 },
      primary: "#435A24",
      secondary: "#7C9F54",
      accent: "#E8F3D6",
      text: "#FFFFFF",

      fluids: {
        milk: { r: 255, g: 252, b: 245 },
        // 可以根據需求添加其他流體顏色
      },
    },
    // 其他設定與咖啡主題相似
  },
};

// 當前主題
let currentTheme = "coffee";

/**
 * 獲取當前主題設定
 * @returns {Object} 當前主題的完整設定
 */
export function getCurrentTheme() {
  return themes[currentTheme];
}

/**
 * 切換主題
 * @param {string} themeName - 主題名稱 ('coffee' 或 'matcha')
 */
export function switchTheme(themeName) {
  if (themes[themeName]) {
    currentTheme = themeName;
    applyTheme(themes[themeName]);
  }
}

/**
 * 應用主題設定到 UI
 * @param {Object} theme - 主題設定對象
 */
function applyTheme(theme) {
  /* 
    // 1. 更新 CSS 變數
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'string') {
        root.style.setProperty(`--${key}`, value);
      }
    });
  
    // 2. 發送主題變更事件
    document.dispatchEvent(new CustomEvent('themeChanged', { 
      detail: theme 
    }));
    */
}

/**
 * 初始化主題
 * 可以從 localStorage 讀取用戶偏好的主題
 */
export function initTheme() {
  /*
    // 從 localStorage 讀取主題設定
    const savedTheme = localStorage.getItem('preferredTheme');
    if (savedTheme && themes[savedTheme]) {
      switchTheme(savedTheme);
    } else {
      // 使用預設主題
      switchTheme('coffee');
    }
    */
}

/**
 * 保存主題偏好
 * @param {string} themeName - 主題名稱
 */
export function saveThemePreference(themeName) {
  /*
    localStorage.setItem('preferredTheme', themeName);
    */
}

// 未來可能需要的功能：
/*
  1. 自動主題切換（根據時間）
  export function enableAutoTheme() {
    const hour = new Date().getHours();
    if (hour >= 18 || hour < 6) {
      switchTheme('coffee');  // 晚上使用深色主題
    } else {
      switchTheme('matcha');  // 白天使用淺色主題
    }
  }
  
  2. 系統主題跟隨
  function followSystemTheme() {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    darkModeMediaQuery.addListener((e) => {
      switchTheme(e.matches ? 'coffee' : 'matcha');
    });
  }
  
  3. 自定義主題
  export function createCustomTheme(name, settings) {
    themes[name] = settings;
  }
  
  4. 主題預覽
  export function previewTheme(themeName) {
    // 臨時應用主題但不保存
  }
  */
