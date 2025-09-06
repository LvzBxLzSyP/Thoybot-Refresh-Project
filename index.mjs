console.log('[Bootstrap] Starting bot');
const appVer = '0.5.0';
console.log(`[Bootstrap] Launching Thoybot v${appVer}`);

import { createRequire } from 'module';
const require = createRequire(import.meta.url || __filename);
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        console.error(`[Bootstrap/Fatal] Missing required module '${moduleName}', please run 'npm i'`);
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
 * Checks if the required configuration values are present and valid.
 * 
 * This function checks whether the configuration object contains the necessary keys (`token`, `clientId`, and `timezone`).
 * It also ensures that these values are not empty strings or null/undefined.
 * If any of the required keys are missing or invalid, an error message is logged and the process exits.
 *
 * @param {Object} config - The configuration object to be validated.
 * @param {string} config.token - The token required for authentication.
 * @param {string} config.clientId - The client ID required for identification.
 * @param {string} config.timezone - The timezone to be used for date and time formatting.
 * @throws {Error} Will throw an error and terminate the process if any required values are missing or invalid.
 */
function checkConfigValues(config) {
    const requiredKeys = ['token', 'clientId', 'timezone', 'tzPerPages'];
    const missingKeys = requiredKeys.filter(key => !config[key] || (typeof config[key] === 'string' && config[key].trim() === ''));

    if (missingKeys.length > 0) {
        console.error(`[Bootstrap/Fatal] Missing or invalid config values for: ${missingKeys.join(', ')}`);
        process.exit(1);
    }
}

// Safely load required modules
const discord = safeRequire('discord.js');
const luxon = safeRequire('luxon');
const fs = safeRequire('fs');
const readline = safeRequire('readline');
const winston = safeRequire('winston');
const DailyRotateFile = safeRequire('winston-daily-rotate-file');
const { getClockEmoji, getRandomColor, translate } = safeRequire('./utils/loadUtils.js');

// Load configuration file
let config;
try {
    config = require('./configs/config')
    console.log("[Bootstrap/Config] Config file 'config.js' loaded successfully.");
} catch (error) {
    console.error('[Bootstrap/Fatal] Missing or invalid config.js file.');
    console.error(`[Bootstrap/Fatal] Error info:${error}`);
    process.exit(1);
}

// Validate configuration values
checkConfigValues(config);

/**
 * Log level mapping table, which maps different environments to different log levels.
 * @type {Object<string, string>}
 * @property {string} development - Corresponds to the log level 'debug' for the development environment.
 * @property {string} production - Corresponds to the log level 'warn' for the production environment.
 * @property {string} test - Corresponds to the log level 'error' for the test environment.
 */
const levelMapping = {
    development: 'debug',
    production: 'warn',
    test: 'error'
};

/**
 * Logic to determine the log level.
 * The log level is determined based on the configuration value (`config.logLevel`),
 * the environment variable (`process.env.NODE_ENV`), and a default value.
 * 
 * @type {string} The log level, which can be one of the following values:
 * 'silly', 'input', 'verbose', 'prompt', 'debug',
 * 'info', 'data', 'help', 'warn', 'error', 'fatal', or the default value 'info'.
 */
const logLevel =
    config.logLevel ||
    levelMapping[process.env.NODE_ENV] || // Maps `NODE_ENV` value to a log level
    'info';

// Import specific parts of modules after ensuring they exist
console.log('[Bootstrap] Setting packages');
const { Client, Collection, Events, GatewayIntentBits, MessageFlags, SlashCommandBuilder, REST, Routes } = discord;
const { DateTime } = luxon;
console.log('[Bootstrap] Successfully set packages');

console.log(`[Bootstrap] Timezone: ${config.timezone}`);

const ITEMS_PER_PAGE = config.tzPerPages; // set timezones per pages
console.log(`[Bootstrap] Timezone per page: ${ITEMS_PER_PAGE}`);

console.log('[Bootstrap] Initializing client');
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds
    ]
});
console.log('[Bootstrap] Initialized client');

console.log('[Bootstrap] Setting up basic output functions');
const customLevels = {
    silly: 10,
    input: 9,
    verbose: 8,
    prompt: 7,
    debug: 6,
    info: 5,
    data: 4,
    help: 3,
    warn: 2,
    error: 1,
    fatal: 0
};

// Custom color
const customColors = {
    silly: 'grey',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    debug: 'blue',
    info: 'green',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    error: 'red',
    fatal: 'bold red'
};

// Timestamp formatting function
const formatTimestamp = (tz = config.timezone || 'UTC') => {
    return DateTime.now().setZone(tz).toFormat('yyyy-MM-dd HH:mm:ss.SSS');
};

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp }) => {
    // If it is ERROR or FATAL, the entire log needs to be colored
    if (level === 'error' || level === 'fatal') {
      return `${timestamp} [${winston.format.colorize().colorize(level, level.toUpperCase())}]: ${winston.format.colorize().colorize(level, message)}`;
    } else {
      // For other levels, only the level field is colored
      return `${timestamp} [${winston.format.colorize().colorize(level, level.toUpperCase())}]: ${message}`;
    }
  })
);

const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

winston.addColors(customColors); // Register a custom color

// Create Logger
const logger = winston.createLogger({
    levels: customLevels,
    level: logLevel, // Preset captures all levels
    format: winston.format.combine(
        winston.format((info) => {
            info.timestamp = formatTimestamp();  // Add timestamp
            return info;
        })()
    ),
    transports: [
        // Console output (color)
        new winston.transports.Console({
            level: logLevel,  // Console shows all levels
            format: winston.format.combine(
                logFormat,
                winston.format.timestamp()
            ),
            stderrLevels: [ 'error', 'fatal' ]
        }),

        // Detailed logs of daily rotation (only info and higher level logs are recorded)
        new DailyRotateFile({
            level: 'info',  // Only logs at info level and above are recorded
            format: winston.format.combine(
                fileFormat,
                winston.format.timestamp()
            ),
            dirname: path.join(process.cwd(), 'logs'),
            filename: 'combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        }),

        // Error log (only error and higher level logs are recorded)
        new DailyRotateFile({
            level: 'error',  // Only logs with error level and above are recorded
            format: winston.format.combine(
                fileFormat,
                winston.format.timestamp()
            ),
            dirname: path.join(process.cwd(), 'logs'),
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        }),

        // Fatal error log (only fatal level logs are recorded)
        new DailyRotateFile({
            level: 'fatal',  // Only log fatal level logs
            format: winston.format.combine(
                fileFormat,
                winston.format.timestamp()
            ),
            dirname: path.join(process.cwd(), 'logs'),
            filename: 'fatal-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d'
        })
    ],
    exitOnError: false
});

// Create corresponding timestamped methods for all levels
const createTimestampMethod = (level) => {
    return (message, ...args) => {
        logger.log({
            level,
            message: message,
            ...args
        });
    };
};

// Create a log method corresponding to the original method
const logWithTimestamp = createTimestampMethod('info');
const warnWithTimestamp = createTimestampMethod('warn');
const errorWithTimestamp = createTimestampMethod('error');
const infoWithTimestamp = createTimestampMethod('info');

// Additional ways to add other levels
const sillyWithTimestamp = createTimestampMethod('silly');
const inputWithTimestamp = createTimestampMethod('input');
const verboseWithTimestamp = createTimestampMethod('verbose');
const promptWithTimestamp = createTimestampMethod('prompt');
const debugWithTimestamp = createTimestampMethod('debug');
const dataWithTimestamp = createTimestampMethod('data');
const helpWithTimestamp = createTimestampMethod('help');
const fatalWithTimestamp = (message, ...args) => {
    const fatal = true;
    global.fatal = fatal;
    const meta = args.length > 0 ? { additionalData: args } : {};
    
    // Recording logs
    logger.log('fatal', message, meta);
    
    // Execute cleanup logic immediately
    console.error(`FATAL ERROR: ${message}`);
    if (global.rl) global.rl.close();
    if (typeof client !== 'undefined') client.destroy();
};
console.log('[Bootstrap] Basic output function setting successfully');

console.log('[Bootstrap] Globalize variables');
global.client = client;
global.appVer = appVer;
global.config = config;
global.ITEMS_PER_PAGE = ITEMS_PER_PAGE;
global.getRandomColor = getRandomColor;
global.getClockEmoji = getClockEmoji;
global.translate = translate;
global.logWithTimestamp = logWithTimestamp;
global.warnWithTimestamp = warnWithTimestamp;
global.errorWithTimestamp = errorWithTimestamp;
global.infoWithTimestamp = infoWithTimestamp;
global.sillyWithTimestamp = sillyWithTimestamp;
global.inputWithTimestamp = inputWithTimestamp;
global.verboseWithTimestamp = verboseWithTimestamp;
global.promptWithTimestamp = promptWithTimestamp;
global.debugWithTimestamp = debugWithTimestamp;
global.dataWithTimestamp = dataWithTimestamp;
global.helpWithTimestamp = helpWithTimestamp;
global.fatalWithTimestamp = fatalWithTimestamp;
console.log('[Bootstrap] Global variables set successfully');

console.log('[Bootstrap] Set variables');
client.commands = new Collection();
client.buttons = new Collection();
client.selectMenus = new Collection();
client.commandInfo = {}; // Used to store info for each command
console.log('[Bootstrap] All variables are set successfully');

console.log('[Bootstrap] Setting module loader');
const isESM = (() => {
    try {
        const pkgPath = path.join(process.cwd(), 'package.json');
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
        return pkg.type === 'module';
    } catch {
        return false;
    }
})();

const loadModule = async (filePath) => {
    const ext = path.extname(filePath);

    try {
        if (ext === '.cjs') return require(filePath);
        if (ext === '.mjs') return await import(pathToFileURL(filePath).href);

        if (ext === '.js') {
            if (isESM) {
                try {
                    // 嘗試用 ESM parser
                    return await import(pathToFileURL(filePath).href);
                } catch (err) {
                    // 如果其實是 CJS，就 fallback
                    if (err.code === 'ERR_MODULE_NOT_FOUND' || err.code === 'ERR_UNKNOWN_FILE_EXTENSION' || err instanceof SyntaxError) {
                        return requireCJS(filePath);
                    }
                    throw err; // 其他錯誤照拋
                }
            } else {
                return require(filePath);
            }
        }

        throw new Error(`[Loader] Unsupported extension: ${ext}`);
    } catch (err) {
        throw new Error(`[Loader] Failed to load ${filePath}: ${err.message}`);
    }
}


console.log('[Bootstrap] Setting command function');
/**
 * Load all commands from commands
 * @returns {*[]} - Commands array
 */
const loadCommands = async () => {
    logWithTimestamp('[Command] Starting to load commands');

    if (!client.commands) client.commands = new Collection();
    if (!client.commandInfo) client.commandInfo = {};

    const dir = path.join(__dirname, 'commands');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));

    let loadedCount = 0;
    const commands = [];

    for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
            const mod = await loadModule(fullPath);
            const command = mod.default || mod;

            if (!command.data && command.name) command.data = { name: command.name };
            if (!command.data || !command.execute) {
                warnWithTimestamp(`[Command] Invalid command: ${file}`);
                continue;
            }

            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON ? command.data.toJSON() : command.data);

            if (command.info) client.commandInfo[command.data.name] = command.info;
            if (command.subcommands) {
                await loadSubcommands(command.subcommands, command.data);
            }

            debugWithTimestamp(`[Command] Loaded: ${command.data.name}`);
            loadedCount++;
        } catch (err) {
            errorWithTimestamp(`[Command] Failed to load ${file}: ${err}`);
        }
    }

    logWithTimestamp(`[Command] Total loaded: ${loadedCount}`);
    return commands;
};

/**
 * If parent command has subcommands then load it
 * @param subcommands - command.subcommand[]
 * @param parentCommandData - command
 */
// Loading subcommands
const loadSubcommands = async (subcommands, parentCommandData) => {
    if (!parentCommandData.addSubcommand) {
        errorWithTimestamp(`[Subcommand] Parent command '${parentCommandData.name}' does not have 'addSubcommand'. Skipping subcommands.`);
        return;
    }

    logWithTimestamp(`[Subcommand] Loading subcommands for ${parentCommandData.name}`);

    let loadedCount = 0;

    for (const sub of subcommands) {
        try {
            let subcommand;

            if (typeof sub === 'string') {
                const fullPath = path.join(__dirname, 'commands', sub);
                const mod = await loadModule(fullPath);
                subcommand = mod.default || mod;
            } else {
                subcommand = sub;
            }

            const fullCommandName = `${parentCommandData.name} ${subcommand.data?.name || subcommand.name}`;

            if (!subcommand || !subcommand.data || !subcommand.data.name || !subcommand.execute) {
                warnWithTimestamp(`[Subcommand] Invalid subcommand: ${fullCommandName}`);
                continue;
            }

            if (subcommand.enabled === false) {
                warnWithTimestamp(`[Subcommand] Subcommand '${fullCommandName}' is disabled, skipping.`);
                continue;
            }

            parentCommandData.addSubcommand(subcommand.data);

            if (subcommand.info) client.commandInfo[fullCommandName] = subcommand.info;

            client.commands.set(fullCommandName, subcommand);

            debugWithTimestamp(`[Subcommand] Loaded: ${fullCommandName}`);
            loadedCount++;
        } catch (err) {
            errorWithTimestamp(`[Subcommand] Failed to load subcommand: ${err}`);
        }
    }

    const word = loadedCount === 1 ? 'subcommand' : 'subcommands';
    logWithTimestamp(`[Subcommand] Loaded ${loadedCount} ${word} for ${parentCommandData.name}`);
};
console.log('[Bootstrap] Command function set successfully');

console.log('[Bootstrap] Setting button function');
const loadButtons = async () => {
    logWithTimestamp('[Button] Starting to load buttons');

    const dir = path.join(__dirname, 'buttons');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));

    for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
            const mod = await loadModule(fullPath);
            const button = mod.default || mod;

            if (button.customId && button.execute) {
                if (Array.isArray(button.customId)) {
                    button.customId.forEach(id => client.buttons.set(id, button));
                } else {
                    client.buttons.set(button.customId, button);
                }
                debugWithTimestamp(`[Button] Loaded: ${button.customId}`);
            } else {
                warnWithTimestamp(`[Button] Invalid button file: ${file}`);
            }
        } catch (err) {
            errorWithTimestamp(`[Button] Failed to load ${file}: ${err}`);
        }
    }

    logWithTimestamp('[Button] All buttons loaded');
};
console.log('[Bootstrap] Button function set successfully');

console.log('[Bootstrap] Setting menu function');
const loadSelectMenus = async () => {
    logWithTimestamp('[SelectMenu] Starting to load select menus');

    const dir = path.join(__dirname, 'selectmenu');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));

    for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
            const mod = await loadModule(fullPath);
            const menu = mod.default || mod;

            if (menu.data && menu.execute) {
                client.selectMenus.set(menu.data.custom_id, menu);
                debugWithTimestamp(`[SelectMenu] Loaded: ${menu.data.custom_id}`);
            } else {
                warnWithTimestamp(`[SelectMenu] Invalid select menu file: ${file}`);
            }
        } catch (err) {
            errorWithTimestamp(`[SelectMenu] Failed to load ${file}: ${err}`);
        }
    }

    logWithTimestamp('[SelectMenu] All select menus loaded');
};
console.log('[Bootstrap] Menu function set successfully');

console.log('[Bootstrap] Setting readline function');
const loadReadlineCommands = async () => {
    logWithTimestamp('[Readline] Starting to load readline commands');

    const dir = path.join(__dirname, 'console');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));

    const readlineCommands = {};

    for (const file of files) {
        const fullPath = path.join(dir, file);
        try {
            const mod = await loadModule(fullPath);
            const command = mod.default || mod;

            if (command.name) {
                readlineCommands[command.name] = command;
                debugWithTimestamp(`[Readline] Loaded: ${command.name}`);
            } else {
                warnWithTimestamp(`[Readline] Invalid command in ${file}`);
            }
        } catch (err) {
            errorWithTimestamp(`[Readline] Failed to load ${file}: ${err}`);
        }
    }

    logWithTimestamp('[Readline] All readline commands loaded');
    return readlineCommands;
};
console.log('[Bootstrap] Readline function set successfully');

console.log('[Bootstrap] Setting register command function');
/**
 * Register slash command
 * @param commands - Commands arrays
 * @returns {Promise<void>}
 */
const registerSlashCommands = async (commands) => {
    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
        logWithTimestamp('[Command] Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
        logWithTimestamp('[Command] Successfully reloaded application (/) commands.');
    } catch (error) {
        errorWithTimestamp('[Command] Failed to register slash commands:', error);
    }
};
console.log('[Bootstrap] Register command function set successfully');

// Set other functions
/**
 * Logs current memory usage for debugging and monitoring.
 * Outputs RSS, heap total, heap used, and external memory in MB.
 * 
 * @example
 * logMemoryUsage();
 * // Output:
 * // 2025-06-28 01:46:33.418 [DEBUG]: [Memory] Usage: RSS: 16.46 MB, Heap Total: 39.82 MB,
 * // 2025-06-28 01:46:33.431 [DEBUG]: [Memory] Usage: Heap Used: 36.51 MB, External: 4.34 MB
 */
function logMemoryUsage() {
    const memoryUsage = process.memoryUsage();
    
    // Pre-calculate each value and keep two decimal places
    const rss = (memoryUsage.rss / 1024 / 1024).toFixed(2);       // Resident Set Size (RSS)
    const heapTotal = (memoryUsage.heapTotal / 1024 / 1024).toFixed(2); // Total heap memory allocated
    const heapUsed = (memoryUsage.heapUsed / 1024 / 1024).toFixed(2);   // Heap memory currently in use
    const external = (memoryUsage.external / 1024 / 1024).toFixed(2);   // External memory used by V8
    
    // Print memory usage details, each on a separate line for clarity
    debugWithTimestamp(`[Memory] Usage: RSS: ${rss} MB, Heap Total: ${heapTotal} MB,`);
    debugWithTimestamp(`[Memory] Usage: Heap Used: ${heapUsed} MB, External: ${external} MB`);
}
// Execute every 5 minutes (300000 milliseconds)
setInterval(logMemoryUsage, 300000);

function getEnvironmentInfo() {
    // Detecting node-supervisor
    const isNodeSupervisor = !!(
        process.env._ && process.env._.includes('supervisor') // Check boot path
    );
    
    const env = {
        isPM2: !!(process.env.PM2_HOME || process.env.pm_id !== undefined),
        isSupervisor: isNodeSupervisor,
        isForever: !!(process.env._ && process.env._.includes('forever')),
        isNodemon: !!(process.env._ && process.env._.includes('nodemon')),
        isDocker: !!process.env.DOCKER_CONTAINER,
        isProduction: process.env.NODE_ENV === 'production',
        hasTTY: !!(process.stdout.isTTY && process.stdin.isTTY),
        manager: 'direct'
    };
    
    // Priority testing
    if (env.isPM2) {
        env.manager = 'PM2';
    } else if (env.isSupervisor) {
        env.manager = 'node-supervisor';
    } else if (env.isForever) {
        env.manager = 'Forever';
    } else if (env.isNodemon) {
        env.manager = 'Nodemon';
    } else if (env.isDocker) {
        env.manager = 'Docker';
    }
    
    env.shouldEnablePrompt = env.hasTTY && env.manager === 'direct';
    
    return env;
}

// Initialize the robot
console.log(`[Bootstrap] Initializing bot event 'ready'`);
client.once(Events.ClientReady, async () => {
    // Register slash command
    const commands = await loadCommands();
    await loadButtons();
    await loadSelectMenus();
    await registerSlashCommands(commands);
    
    logWithTimestamp(`[Client] Logged in as ${client.user.tag}!`);
    logWithTimestamp('[Bot] bot started successfully');
    logMemoryUsage();
    
    const env = getEnvironmentInfo();
    debugWithTimestamp(`[System] Running under: ${env.manager}`);
    
    if (env.shouldEnablePrompt) {
        debugWithTimestamp('[System] Interactive prompt enabled');
        
        initReadline();
    } else {
        logWithTimestamp('[System] Interactive prompt disabled (managed environment)');
    }
});
console.log(`[Bootstrap] Initialized bot event 'ready'`);

console.log(`[Bootstrap] Initializing bot event 'interactionCreate'`);
// Listen for interaction events
client.on(Events.InteractionCreate, 
    /**
     * Event handler for Discord's `interactionCreate` event.
     * This function handles various types of user interactions, such as slash commands, buttons, 
     * and string select menus, and ensures appropriate responses.
     * 
     * - **Slash Commands:** Retrieves and executes the corresponding command logic based on the command name.
     * - **Buttons:** Identifies the button's custom ID, retrieves the handler, and executes its logic.
     * - **String Select Menus:** Finds the handler based on the menu's custom ID and executes it.
     * 
     * @param {import('discord.js').Interaction} interaction - The interaction object triggered by a user action.
     *    This object contains details about the type of interaction and associated data (e.g., custom ID, command name).
     * 
     * @returns {Promise<void>} A promise that resolves after successfully handling the interaction or logs an error.
     */
    async (interaction) => {
        // Handling slash commands
        if (interaction.isChatInputCommand()) {
            /**
             * Retrieve the command handler from the `client.commands` collection using the command name.
             * This collection is expected to be a `Collection` where keys are command names, and values are the corresponding handler objects.
             */
            const command = client.commands.get(interaction.commandName);
    
            if (!command) {
                // No command handler found for the given command name
                warnWithTimestamp(`[Command] No handler found for command: ${interaction.commandName}`);
                return;
            }
        
            try {
                // Execute the command's main logic
                await command.execute(interaction);
            } catch (error) {
                // Log the error with a timestamp for debugging
               errorWithTimestamp(`[Command] An error occurred while executing command: ${interaction.commandName}\n${error}`);
        
                // Handle the error response based on whether the interaction was already replied to
                if (interaction.replied || interaction.deferred) {
                    // If interaction already replied/deferred, use editReply to show error message
                    await interaction.editReply({ content: 'An error occurred, please try again later!', flags: MessageFlags.Ephemeral });
                } else {
                    // Otherwise, send a new reply with an ephemeral error message
                    await interaction.reply({ content: 'An error occurred, please try again later!', flags: MessageFlags.Ephemeral });
                }
            }
        } else if (interaction.isButton()) {
            /**
             * Handling button interactions.
             * The `customId` is expected to be a string with a specific format (e.g., "action_subaction"),
             * and this logic splits it into base parts to identify the corresponding handler.
             */
            const baseId = interaction.customId.split('_').slice(0, 2).join('_'); // Extract base ID from custom ID
            const button = client.buttons.get(baseId); // Retrieve the handler for the button

            if (!button) {
                // No handler found for the given button ID
                warnWithTimestamp(`[Button] No handler found for button ID: ${interaction.customId}`);
                return;
            }

            try {
                // Execute the button's logic
                await button.execute(interaction);
            } catch (error) {
                // Log and handle errors specific to button interactions
                errorWithTimestamp(`[Button] An error occurred for button ID: ${interaction.customId}\n${error}`);
                await interaction.reply({ content: 'An error occurred while processing your action.', flags: MessageFlags.Ephemeral });
            }
        } else if (interaction.isStringSelectMenu()) {
            /**
             * Handling string select menu interactions.
             * The `customId` is used to identify the specific menu and retrieve its handler.
             */
            const customId = interaction.customId;
            const selectMenuHandler = client.selectMenus.get(customId); // Retrieve the handler for the select menu

            if (!selectMenuHandler) {
                // No handler found for the given select menu ID
                warnWithTimestamp(`[SelectMenu] No handler found for select menu ID: ${customId}`);
                return;
            }

            try {
                // Execute the select menu's logic
                await selectMenuHandler.execute(interaction);
            } catch (error) {
                // Log and handle errors specific to select menu interactions
                errorWithTimestamp(`[SelectMenu] An error occurred for select menu ID: ${customId}\n${error}`);
                await interaction.reply({ content: 'An error occurred while processing your selection.', flags: MessageFlags.Ephemeral });
            }
        } else {
            // Log a warning for unhandled interaction types
            warnWithTimestamp(`[Interaction] Unhandled interaction type: ${interaction.type}`);
        }
    }
);

console.log(`[Bootstrap] Initialized bot event 'interactionCreate'`);

// Login bot
console.log('[Bootstrap] Bootstrap End, logging bot');
client.login(config.token);

// Load event handler
const loadEvents = async () => {
    const dir = path.join(__dirname, 'events');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));

    logWithTimestamp('[Event] Starting load events');

    for (const file of files) {
        try {
            const fullPath = path.join(dir, file);
            const mod = await loadModule(fullPath); // loadModule 是你前面定義的通用模組載入器
            const event = mod.default || mod;

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
                debugWithTimestamp(`[Event] Loaded once event ${event.name}`);
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
                debugWithTimestamp(`[Event] Loaded on event ${event.name}`);
            }
        } catch (err) {
            errorWithTimestamp(`[Event] Failed to load event file ${file}: ${err}`);
        }
    }

    logWithTimestamp('[Event] Finished loading all events');
};
await loadEvents();

const initReadline = async () => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '> '
    });
        
    const rlcmd = await loadReadlineCommands();
        
    rl.on('line', (input) => {
        const trimmedInput = input.trim();
            
        // Skip processing if input is empty
        if (!trimmedInput) {
            rl.prompt();
            return;
        }
        
        const command = rlcmd[trimmedInput];
        
        if (command) {
            try {
                command.execute(rl, client); // Assuming each command has an `execute` method
            } catch (err) {
                errorWithTimestamp(`Error executing command: ${trimmedInput}`, err);
            }
        } else {
            errorWithTimestamp(`[Readline] Unknown command: ${trimmedInput}`);
        }
    
        rl.prompt();
    });
        
    // Listen to the readline interface closing event
    rl.on('close', () => {
        logWithTimestamp('[Client] Bot exiting');
        
        if (typeof global.fatal === 'undefined') {
            global.fatal = false;
        };
        if (fatal == false) {
            process.exit(0); // Exit Program
        } else {
            process.exit(1);
        }
    });
    
    rl.prompt();
    global.rl = rl;
}