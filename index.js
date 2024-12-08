console.log('[Bootstrap] Starting bot');
const appVer = '0.4.0';
console.log(`[Bootstrap] Launching Thoybot v${appVer}`)

/**
 * Checks if a required module is installed.
 * If the module is missing, logs an error and exits the program.
 * 
 * @param {string} moduleName - The name of the module to check.
 */
function ensureModuleExists(moduleName) {
    try {
        require.resolve(moduleName);
        console.log(`[Bootstrap/Module] Module '${moduleName}' is loaded successfully.`);
    } catch {
        console.error(`[Bootstrap/Fatal] Missing required module '${moduleName}'.`);
        process.exit(1);
    }
}

/**
 * Dynamically requires a module after ensuring it exists.
 * 
 * @param {string} moduleName - The name of the module to require.
 * @returns {*} - The required module.
 */
function safeRequire(moduleName) {
    ensureModuleExists(moduleName);
    return require(moduleName);
}

/**
 * Validates that all required keys in the configuration file are present and non-empty.
 * Logs missing or invalid keys and exits the program if any issues are found.
 * 
 * @param {Object} config - The configuration object loaded from config.json.
 * @param {string} config.token - The bot token for authentication.
 * @param {string} config.clientId - The client ID of the bot.
 * @param {string} config.timezone - The timezone for the bot's operations.
 */
function checkConfigValues(config) {
    const requiredKeys = ['token', 'clientId', 'timezone'];
    const missingKeys = requiredKeys.filter(key => !config[key] || config[key].trim() === '');

    if (missingKeys.length > 0) {
        console.error(`[Bootstrap/Fatal] Missing or invalid config values for: ${missingKeys.join(', ')}`);
        process.exit(1);
    }
}

// Safely load required modules
const discord = safeRequire('discord.js');
const moment = safeRequire('moment-timezone');
const fs = safeRequire('fs');
const path = safeRequire('path');
const readline = safeRequire('readline');
const { getClockEmoji, getRandomColor } = safeRequire('./utils/loadUtils.js');

// Load configuration file
let config;
try {
    config = require('./config.json');
    console.log("[Bootstrap/Config] Config file 'config.json' loaded successfully.");
} catch (error) {
    console.error('[Bootstrap/Fatal] Missing or invalid config.json file.');
    process.exit(1);
}

// Validate configuration values
checkConfigValues(config);

// Import specific parts of modules after ensuring they exist
console.log('[Bootstrap] Setting discord.js');
const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = discord;
console.log('[Bootstrap] Successfully set discord');

console.log(`[Bootstrap] Timezone: ${config.timezone}`);

const ITEMS_PER_PAGE = config.tzperpages; // 每頁顯示25個時區
console.log(`[Bootstrap] Timezone per page: ${ITEMS_PER_PAGE}`);


console.log('[Bootstrap] Initializing client');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
console.log('[Bootstrap] Initialized client');

console.log('[Bootstrap] Initializing readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});
console.log('[Bootstrap] Initialized readline');

console.log('[Bootstrap] Setting up basic output functions');
const formatTimestamp = () => {
  // 使用config.timezone取得指定時區
  const now = moment().tz(config.timezone);  // 轉換為指定時區時間
  return now.format('YYYY-MM-DD HH:mm:ss.SSS');  // 保留到毫秒部分
};

const logWithTimestamp = (message) => {
  const timestamp = formatTimestamp();
  console.log(`${timestamp} ${message}`);
};

const warnWithTimestamp = (message) => {
  const timestamp = formatTimestamp();
  console.warn(`${timestamp} ${message}`);
};

const errorWithTimestamp = (message) => {
  const timestamp = formatTimestamp();
  console.error(`${timestamp} ${message}`);
};

const infoWithTimestamp = (message) => {
  const timestamp = formatTimestamp();
  console.info(`${timestamp} ${message}`);
};
console.log('[Bootstrap] Basic output function setting successfully');

console.log('[Bootstrap] Globalize variables');
global.client = client;
global.appVer = appVer;
global.getRandomColor = getRandomColor;
global.getClockEmoji = getClockEmoji;
global.logWithTimestamp = logWithTimestamp;
global.infoWithTimestamp = infoWithTimestamp;
global.warnWithTimestamp = warnWithTimestamp;
global.errorWithTimestamp = errorWithTimestamp;
console.log('[Bootstrap] Global variables set successfully');

console.log('[Bootstrap] Set variables');
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.commandInfo = {}; // 用來存儲每個命令的info
console.log('[Bootstrap] All variables are set successfully');

console.log('[Bootstrap] Setting command function');
const loadCommands = () => {
    logWithTimestamp('[INFO/Command] Starting load commands');
    if (!client.commands) client.commands = new Map();
    if (!client.commandInfo) client.commandInfo = {};

    const commandFiles = fs.readdirSync(path.join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
    const commands = [];
    let loadedCommandCount = 0; // 記錄已加載的命令數量

    for (const file of commandFiles) {
        try {
            const command = require(path.join(__dirname, 'commands', file));

            // 確保命令的結構正確
            if (!command || !command.data || !command.data.name || !command.execute) {
                warnWithTimestamp(`Warning: Command file ${file} is missing 'data' or 'name' or 'execute'. Skipping this file.`);
                continue;
            }
            
            if (command.enabled === false) {
                infoWithTimestamp(`[INFO/Command] Command '${command.data.name}' is disabled, skipping.`);
                continue;
            }

            // 輸出當前命令載入的訊息
            logWithTimestamp(`[INFO/Command] Loaded command: ${command.data.name}`);
            loadedCommandCount++; // 每加載一條命令，增加計數

            // 遞歸載入子命令
            if (command.subcommands) {
                loadSubcommands(command.subcommands, command.data);
            }

            // 將命令加入集合中
            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());

            if (command.info) {
                client.commandInfo[command.data.name] = command.info;
            }

        } catch (error) {
            errorWithTimestamp(`Error loading command file ${file}:`, error);
        }
    }

    // 顯示加載的命令數量
    logWithTimestamp(`[INFO/Command] Total commands loaded: ${loadedCommandCount}`);
    logWithTimestamp('[INFO/Command] All commands loaded');

    return commands;
};

// Loading subcommands
const loadSubcommands = (subcommands, parentCommandData) => {

    logWithTimestamp('[INFO/Subcommand] Starting load subcommands');
    // Ensure the parent command has the method `addSubcommand`
    if (!parentCommandData.addSubcommand) {
        errorWithTimestamp(`[ERROR/Subcommand] Parent command '${parentCommandData.name}' does not have the method 'addSubcommand'. Skipping subcommands.`);
        return;
    }
    
    logWithTimestamp(`[INFO/Subcommand] Loading subcommands for ${parentCommandData.name}`);

    // Initialize a counter for the number of loaded subcommands
    let loadedSubcommandsCount = 0;

    // Iterate over all subcommands
    for (const subcommand of subcommands) {
        const fullCommandName = `${parentCommandData.name} ${subcommand.data.name}`;

        try {
            // Make sure the subcommand structure is correct
            if (!subcommand || !subcommand.data || !subcommand.data.name || !subcommand.execute) {
                warnWithTimestamp(`[WARN/Subcommand] Warning: Subcommand '${fullCommandName}' is missing 'data' or 'name' or 'execute'. Skipping.`);
                continue;
            }

            // If the subcommand is disabled, it is skipped.
            if (subcommand.enabled === false) {
                infoWithTimestamp(`[INFO/Subcommand] Subcommand '${fullCommandName}' is disabled, skipping.`);
                continue;
            }

            // Add subcommand to the parent command's subcommand
            parentCommandData.addSubcommand(subcommand.data);

            // Output information about successful subcommand loading
            logWithTimestamp(`[INFO/Subcommand] Loaded subcommand: ${fullCommandName}`);

            // If there is additional information, it can be stored
            if (subcommand.info) {
                client.commandInfo[fullCommandName] = subcommand.info;
            }

            // Subcommands are added to the client's command set.
            client.commands.set(fullCommandName, subcommand);

            // Increment the count of loaded subcommands
            loadedSubcommandsCount++;

        } catch (error) {
            errorWithTimestamp(`[ERROR/Subcommand] Error loading subcommand '${fullCommandName}':`, error);
        }
    }

    // Display the number of loaded subcommands for the parent command
    const subcommandWord = loadedSubcommandsCount === 1 ? 'subcommand' : 'subcommands';
    logWithTimestamp(`[INFO/Subcommand] Loaded ${loadedSubcommandsCount} ${subcommandWord} for ${parentCommandData.name}`);
};
console.log('[Bootstrap] Command function set successfully');

console.log('[Bootstrap] Setting button function');
const loadButtons = () => {
    const buttonFiles = fs.readdirSync(path.join(__dirname, 'buttons')).filter(file => file.endsWith('.js'));
    
    logWithTimestamp('[INFO/Button] Starting load buttons');

    for (const file of buttonFiles) {
        const button = require(path.join(__dirname, 'buttons', file));
        if (button.customId && button.execute) {
            if (Array.isArray(button.customId)) {
                // 如果有多個 customId，分別註冊
                button.customId.forEach(id => client.buttons.set(id, button));
            } else {
                client.buttons.set(button.customId, button);
            }
            logWithTimestamp(`[Info/Button] Loaded button: ${button.customId}`);
        } else {
            warnWithTimestamp(`[Warn/Button] Invalid button file: ${file}`);
        }
    }
    logWithTimestamp('[INFO/Button] Loaded all buttons');
};
console.log('[Bootstrap] Button function set successfully');

console.log('[Bootstrap] Setting menu function');
const loadSelectMenus = () => {
    const selectMenuPath = path.join(__dirname, 'selectmenu'); // 取得 selectmenu 目錄的路徑

    // 讀取目錄下所有以 .js 結尾的文件
    const selectMenuFiles = fs.readdirSync(selectMenuPath).filter(file => file.endsWith('.js'));
    
    logWithTimestamp('[INFO/SelectMenu] Starting load select menus')
    
    // 遍歷每個 select menu 文件
    for (const file of selectMenuFiles) {
        const filePath = path.join(selectMenuPath, file);  // 取得文件的完整路徑
        const selectMenu = require(filePath);  // 动态加载模块

        if (selectMenu.data && selectMenu.execute) {
            // 註冊每個 select menu 的 custom_id 和對應的執行方法
            client.selectMenus.set(selectMenu.data.custom_id, selectMenu);
            logWithTimestamp(`[INFO/SelectMenu] Loaded select menu: ${selectMenu.data.custom_id}`);
        } else {
            warnWithTimestamp(`[WARN/SelectMenu] Invalid select menu file: ${file}`);
        }
    }
    logWithTimestamp('[INFO/SelectMenu] Loaded all select menus');
};
console.log('[Bootstrap] Menu function set successfully');

console.log('[Bootstrap] Setting readline function');
const loadReadlineCommands = () => {
    logWithTimestamp('[INFO/Readline] Starting load readline command');
    
    const readlineCommands = {};

    try {
        // 動態載入命令模組
        fs.readdirSync(path.join(__dirname, 'console')).forEach(file => {
            // 確保只載入以 .js 結尾的文件
            if (file.endsWith('.js')) {
                try {
                    const command = require(path.join(__dirname, 'console', file));
                    if (command.name) {
                        readlineCommands[command.name] = command;
                        logWithTimestamp(`[INFO/Readline] Loaded command ${command.name}`);
                    } else {
                        warnWithTimestamp(`[WARN/Readline] Command in ${file} does not have a 'name' property.`);
                    }
                } catch (err) {
                    errorWithTimestamp(`[ERROR/Readline] Error loading command from ${file}:`, err);
                }
            }
        });
    } catch (err) {
        errorWithTimestamp('[ERROR/Readline] Error reading commands directory:', err);
    }

    logWithTimestamp('[INFO/Readline] Loaded all commands');
    return readlineCommands;
};
console.log('[Bootstrap] Readline function set successfully');

console.log('[Bootstrap] Setting register command function');
// 註冊斜線命令
const registerSlashCommands = async (commands) => {
    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
        logWithTimestamp('[INFO/Command] Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
        logWithTimestamp('[INFO/Command] Successfully reloaded application (/) commands.');
    } catch (error) {
        errorWithTimestamp('[ERROR/Command] Failed to register slash commands:', error);
    }
};
console.log('[Bootstrap] Register command function set successfully');

// 計算時區訊息
console.log('[Bootstrap] Settings other functions');
const getTimezoneMessage = (page) => {
    const timezones = moment.tz.names();
    const ITEMS_PER_PAGE = 25;
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const timezonesOnPage = timezones.slice(startIndex, endIndex);

    const timezonesList = timezonesOnPage.map(tz => `${tz}: ${moment.tz(tz).format('YYYY-MM-DD HH:mm:ss')}`).join('\n');
    return timezonesList;
};
console.log('[Bootstrap] Other functions set successfully');

// 初始化機器人
console.log(`[Bootstrap] Initializing bot event 'ready'`);
client.once('ready', async () => {
    // 註冊斜線命令
    const commands = loadCommands();
    loadButtons();
    loadSelectMenus();
    await registerSlashCommands(commands);
    
    logWithTimestamp(`[INFO/Client] Logged in as ${client.user.tag}!`);
    logWithTimestamp('[INFO/Bot] bot started successfully');
    rl.prompt();
});
console.log(`[Bootstrap] Initialized bot event 'ready'`);

console.log(`[Bootstrap] Initializing bot event 'interactionCreate'`);
// 監聽交互事件
client.on('interactionCreate', async (interaction) => {
    // 處理斜線命令
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;
    
        try {
            await command.execute(interaction);
        } catch (error) {
            errorWithTimestamp(error);
    
            // 如果已經回應過互動，則使用 editReply() 來處理錯誤消息
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ content: '發生錯誤，請稍後再試！', ephemeral: true });
            } else {
                // 否則，回應新的錯誤消息
                await interaction.reply({ content: '發生錯誤，請稍後再試！', ephemeral: true });
            }
        }
    } else if (interaction.isButton()) {
        // 解析按鈕基礎 ID
        const baseId = interaction.customId.split('_').slice(0, 2).join('_');
        const button = client.buttons.get(baseId);
        
        if (!button) {
            warnWithTimestamp(`[WARN/Button] No handler found for button ID: ${interaction.customId}`);
            return;
        }
        
        // 執行按鈕處理邏輯
        button.execute(interaction);
    } else if (interaction.isStringSelectMenu()) {
        const customId = interaction.customId;

        // 尋找並執行對應的 selectMenu
        const selectMenuHandler = client.selectMenus.get(customId);
        if (selectMenuHandler) {
            await selectMenuHandler.execute(interaction);  // 呼叫對應的執行函數
        } else {
            warnWithTimestamp(`[WARN/SelectMenu]No handler found for select menu with ID: ${customId}`);
        }
    }
});
console.log(`[Bootstrap] Initialized bot event 'interactionCreate'`);

// 登入機器人
console.log('[Bootstrap] Bootstrap End, logging bot');
client.login(config.token);

// 加載事件處理器
const loadEvents = () => {
    const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
};

loadEvents();

const rlcmd = loadReadlineCommands();

rl.on('line', (input) => {
    const command = rlcmd[input.trim()];

    if (command) {
        try {
            command.execute(rl, client); // Assuming each command has an `execute` method
        } catch (err) {
            errorWithTimestamp(`Error executing command: ${input}`, err);
        }
    } else {
        logWithTimestamp(`[INFO/Readline] Unknown command: ${input}`);
    }

    rl.prompt();
});

// 監聽 readline 介面關閉事件
rl.on('close', () => {
  logWithTimestamp('[INFO/Client] Bot exiting');
  process.exit(0); // 退出程序
});