const readline = require('readline');
const fs = require('fs');
const path = require('path');

/**
 * Load readline commands
 * @private
 */
const loadReadlineCommands = (clearCache = false) => {
    logWithTimestamp('[Readline] Starting load readline commands');
    
    const readlineCommands = {};
    const commandsPath = path.join(__dirname, 'commands');

    try {
        if (!fs.existsSync(commandsPath)) {
            warnWithTimestamp('[Readline] Commands directory not found');
            return readlineCommands;
        }

        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        for (const file of commandFiles) {
            try {
                const filePath = path.join(commandsPath, file);
                
                if (clearCache) {
                    delete require.cache[require.resolve(filePath)];
                }
                
                const command = require(filePath);
                
                if (command.name && command.execute) {
                    readlineCommands[command.name] = command;
                    debugWithTimestamp(`[Readline] Loaded command: ${command.name}`);
                } else {
                    warnWithTimestamp(`[Readline] Command in ${file} does not have 'name' or 'execute' property.`);
                }
            } catch (err) {
                errorWithTimestamp(`[Readline] Error loading command from ${file}: ${err}`);
            }
        }
        
        logWithTimestamp(`[Readline] Loaded ${Object.keys(readlineCommands).length} commands`);
    } catch (err) {
        errorWithTimestamp(`[Readline] Error reading commands directory: ${err}`);
    }

    return readlineCommands;
};

let rl;
let commands = {};

module.exports = {
    start(client) {
        logWithTimestamp('[Readline] Initializing readline interface');
        
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });

        commands = loadReadlineCommands();

        rl.on('line', (input) => {
            const trimmed = input.trim();
            if (!trimmed) {
                rl.prompt();
                return;
            }

            const args = trimmed.split(/\s+/);
            const cmdName = args.shift();
            const command = commands[cmdName];

            if (command) {
                try {
                    command.execute(rl, client, args);
                } catch (err) {
                    errorWithTimestamp(`[Readline] Error executing command '${cmdName}': ${err}`);
                }
            } else {
                errorWithTimestamp(`[Readline] Unknown command: ${cmdName}`);
                console.log(`Available commands: ${Object.keys(commands).join(', ')}`);
            }

            rl.prompt();
        });

        rl.on('close', () => {
            // Only triggers when not manually closed (e.g., Ctrl+D)
            // If closed via stop()/crash(), this will not be executed.
            logWithTimestamp('[Readline] Readline interface closed by user (Ctrl+D)');
            process.exit();
        });

        rl.prompt();
        global.rl = rl;
        
        logWithTimestamp('[Readline] Readline interface ready');
    },

    reload() {
        if (!rl) {
            warnWithTimestamp('[Readline] Cannot reload: readline not active');
            return { success: false, count: 0 };
        }
        
        logWithTimestamp('[Readline] Reloading commands...');
        commands = loadReadlineCommands(true);
        const count = Object.keys(commands).length;
        logWithTimestamp(`[Readline] Reloaded ${count} commands`);
        
        return { success: true, count };
    },

    getCommands() {
        return commands;
    },

    stop() {
        if (rl) {
            rl.removeAllListeners('close');
            rl.pause();
            
            // Clear prompt
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            
            // First close readline
            rl.close();
            
            // Clear the reference immediately (this will prevent subsequent logs from displaying a prompt).
            const wasActive = rl !== null;
            global.rl = null;
            rl = null;
            
            // It is now safe to log information.
            if (wasActive) {
                logWithTimestamp('[Console] Readline closed');
            }
        }
    },
    
    crash() {
        if (rl) {
            rl.removeAllListeners('close');
            rl.pause();
            
            readline.clearLine(process.stdout, 0);
            readline.cursorTo(process.stdout, 0);
            
            rl.close();
            const wasActive = rl !== null;
            global.rl = null;
            rl = null;
            
            if (wasActive) {
                errorWithTimestamp('[Readline] Readline closed due to a fatal error');
            }
        }
    }
};