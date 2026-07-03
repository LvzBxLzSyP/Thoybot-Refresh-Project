const config = require('../configs/config');
const winston = require('winston');
const { DateTime } = require('luxon');
const fs = require('fs');
const path = require('path');

function validateAdapter(adapter, modeName) {
    const requiredMethods = ['start', 'stop', 'crash', 'reload', 'getCommands'];
    const missingMethods = requiredMethods.filter(method => typeof adapter[method] !== 'function');
    
    if (missingMethods.length > 0) {
        console.error(`[Console] Adapter '${modeName}' is missing required methods: ${missingMethods.join(', ')}`);
        return false;
    }
    
    return true;
}

function addFallbackTransport() {
    // 檢查是否已經有 ReadlineTransport
    const hasReadlineTransport = global.logger.transports.some(
        t => t.constructor.name === 'ReadlineTransport'
    );
    
    if (hasReadlineTransport) {
        console.log('[Console] ReadlineTransport already exists, skipping...');
        return;
    }
    
    // 移除可能存在的預設 Console transport
    const consoleTransports = global.logger.transports.filter(
        t => t.constructor.name === 'Console'
    );
    consoleTransports.forEach(t => {
        global.logger.remove(t);
        console.log('[Console] Removed default Console transport');
    });
    
    // 添加 ReadlineTransport
    const ReadlineTransport = require('../utils/readlineTransport');
    const transport = new ReadlineTransport({
        level: config.logLevel || 'info',
        format: winston.format.combine(
            winston.format((info) => {
                info.timestamp = DateTime.now()
                    .setZone(config.timezone || 'UTC')
                    .toFormat('yyyy-MM-dd HH:mm:ss.SSS');
                return info;
            })()
        )
    });
    
    global.logger.add(transport);
    console.log('[Console] Added fallback ReadlineTransport');
}

function loadConsoleAdapter(env) {
    // 檢查 TTY 支援
    if (!env.shouldEnablePrompt) {
        return require('./disabled');
    }
    
    const mode = config.TTYMode || 'readline';
    
    // 特殊處理：disable 模式直接返回
    if (mode === 'disable') {
        return require('./disabled');
    }
    
    // 嘗試載入對應的模組
    const adapterPath = path.join(__dirname, mode);
    const moduleExists = fs.existsSync(adapterPath) || fs.existsSync(`${adapterPath}.js`);
    
    if (moduleExists) {
        try {
            const adapter = require(`./${mode}`);
            
            if (!validateAdapter(adapter, mode)) {
                throw new Error('Invalid adapter interface');
            }
            
            console.log(`[Console] Loaded console adapter: ${mode}`);
            return adapter;
            
        } catch (err) {
            console.error(`[Console] Failed to load console adapter '${mode}': ${err.message}`);
            console.error('[Console] Falling back to readline mode...\n');
        }
    } else {
        console.error(`[Console] Console adapter '${mode}' not found`);
        
        switch (mode) {
            case 'tui':
                console.error('[Console] To use TUI mode, please install it:');
                console.error('[Console]   cd console');
                console.error('[Console]   git clone <your-tui-repo-url> tui');
                console.error('[Console]   cd tui && npm install');
                break;
            
            default:
                console.error(`[Console] Create a ${mode}.js or ${mode}/index.js file in the console directory`);
                console.error('[Console] The adapter must export: start, stop, crash, reload, getCommands');
                break;
        }
        
        console.error('[Console] Falling back to readline mode...\n');
    }
    
    // Fallback: 嘗試載入 readline
    const readlinePath = path.join(__dirname, 'readline');
    const readlineExists = fs.existsSync(readlinePath) || fs.existsSync(`${readlinePath}.js`);
    
    if (readlineExists) {
        try {
            addFallbackTransport();
            const adapter = require('./readline');
            console.log('[Console] Fallback to readline adapter');
            return adapter;
        } catch (err) {
            console.error(`[Console] Failed to load readline adapter: ${err.message}`);
        }
    }
    
    // 最終 fallback: 如果連 readline 都沒有，使用 disabled
    console.error('[Console] CRITICAL: No valid console adapter found!');
    console.error('[Console] Using disabled adapter as last resort\n');
    return require('./disabled');

module.exports = { loadConsoleAdapter };