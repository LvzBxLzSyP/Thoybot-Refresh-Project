import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const utils = {};
const utilsPath = path.join(__dirname);

// 支援的副檔名
const exts = ['.js', '.mjs', '.cjs'];

async function loadUtils() {
  const files = fs.readdirSync(utilsPath)
    .filter(file => exts.includes(path.extname(file)) && file !== 'loadUtils.js');

  for (const file of files) {
    const utilName = path.basename(file, path.extname(file));
    const filePath = path.join(utilsPath, file);

    let mod;
    if (path.extname(file) === '.cjs') {
      // 如果是 cjs，用 createRequire 載入
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      mod = require(filePath);
    } else {
      // 用 import() 載入 ESM
      mod = await import(`file://${filePath}`);
      mod = mod.default ?? mod; // 如果有 default，就取 default
    }

    // 如果模組是單鍵物件，直接取值
    utils[utilName] = mod && typeof mod === 'object' && Object.keys(mod).length === 1
      ? mod[Object.keys(mod)[0]]
      : mod;
  }

  return utils;
}

export default loadUtils;