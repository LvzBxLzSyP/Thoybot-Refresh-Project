console.log('[Bootstrap] Starting bot');
const appVer = '0.4.0';
console.log(`[Bootstrap] Launching Thoybot v${appVer}`)

const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const config = require('./config.json');
const { getClockEmoji, getRandomColor } = require('./utils/loadUtils.js');

const ITEMS_PER_PAGE = 25; // 每頁顯示25個時區

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '> '
});
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

global.client = client;
global.appVer = appVer;
global.getRandomColor = getRandomColor;
global.getClockEmoji = getClockEmoji;
global.logWithTimestamp = logWithTimestamp;
global.infoWithTimestamp = infoWithTimestamp;
global.warnWithTimestamp = warnWithTimestamp;
global.errorWithTimestamp = errorWithTimestamp;

client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.commandInfo = {}; // 用來存儲每個命令的info

const loadCommands = () => {
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
                logWithTimestamp(`[INFO/Subcommand] Loading subcommands for ${command.data.name}`);
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

    return commands;
};

// Loading subcommands
const loadSubcommands = (subcommands, parentCommandData) => {
    // Ensure the parent command has the method `addSubcommand`
    if (!parentCommandData.addSubcommand) {
        errorWithTimestamp(`[ERROR/Subcommand] Parent command '${parentCommandData.name}' does not have the method 'addSubcommand'. Skipping subcommands.`);
        return;
    }

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

const loadButtons = () => {
    const buttonFiles = fs.readdirSync(path.join(__dirname, 'buttons')).filter(file => file.endsWith('.js'));

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
};

const loadSelectMenus = () => {
    const selectMenuPath = path.join(__dirname, 'selectmenu'); // 取得 selectmenu 目錄的路徑

    // 讀取目錄下所有以 .js 結尾的文件
    const selectMenuFiles = fs.readdirSync(selectMenuPath).filter(file => file.endsWith('.js'));

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
};

const loadReadlineCommands = () => {
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
                    } else {
                        warnWithTimestamp(`Warning: Command in ${file} does not have a 'name' property.`);
                    }
                } catch (err) {
                    errorWithTimestamp(`Error loading command from ${file}:`, err);
                }
            }
        });
    } catch (err) {
        errorWithTimestamp('Error reading commands directory:', err);
    }

    return readlineCommands;
};

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

// 計算時區訊息
const getTimezoneMessage = (page) => {
    const timezones = moment.tz.names();
    const ITEMS_PER_PAGE = 25;
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const timezonesOnPage = timezones.slice(startIndex, endIndex);

    const timezonesList = timezonesOnPage.map(tz => `${tz}: ${moment.tz(tz).format('YYYY-MM-DD HH:mm:ss')}`).join('\n');
    return timezonesList;
};

console.log('[Bootstrap] Bootstrap End');

// 初始化機器人
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
            if (interaction.replied) {
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
            warnWithTimestamp(`No handler found for button ID: ${interaction.customId}`);
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
            warnWithTimestamp(`No handler found for select menu with ID: ${customId}`);
        }
    }
});

// 登入機器人
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
        logWithTimestamp(`Unknown command: ${input}`);
    }

    rl.prompt();
});

// 監聽 readline 介面關閉事件
rl.on('close', () => {
  logWithTimestamp('Program is closed');
  process.exit(0); // 退出程序
});