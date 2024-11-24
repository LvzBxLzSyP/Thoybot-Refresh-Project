const fs = require('fs');
const path = require('path');

const utils = {};
const utilsPath = path.join(__dirname);

// 讀取 utils 資料夾內所有的 .js 文件（排除 loadUtils.js）
fs.readdirSync(utilsPath)
  .filter(file => file.endsWith('.js') && file !== 'loadUtils.js') // 排除自身
  .forEach(file => {
    const utilName = path.basename(file, '.js'); // 提取檔案名稱作為鍵
    const utilModule = require(path.join(utilsPath, file)); // 載入模組

    // 如果模組導出的是對象，且只有一個鍵，直接提取該鍵的值
    utils[utilName] = utilModule && typeof utilModule === 'object' && Object.keys(utilModule).length === 1
      ? utilModule[Object.keys(utilModule)[0]]
      : utilModule;

    // 輸出載入的工具模組名稱
    console.log(`[Bootstrap/Utils] Loaded utility: ${utilName}`);
  });

// 返回解構要求的工具
module.exports = (function() {
  // 檢查當前模塊是否有解構需求
  if (Object.keys(module.parent.exports).length) {
    const keys = Object.keys(module.parent.exports);
    const selectedUtils = {};

    keys.forEach(key => {
      if (utils[key]) {
        selectedUtils[key] = utils[key];
        // 只輸出被解構的工具
        console.log(`[Bootstrap/Utils] Loaded utility: ${key}`);
      }
    });

    return selectedUtils;
  }

  // 如果沒有使用解構，返回所有工具
  return utils;
})();