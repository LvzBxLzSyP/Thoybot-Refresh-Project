const readline = require('readline');
const fs = require('fs');
const path = require('path');
const loadReadlineCommands = () => {
    logWithTimestamp('[Readline] Starting load readline command');
    
    const readlineCommands = {};

    try {
        // Dynamically loading command modules
        fs.readdirSync(path.join(__dirname, 'commands')).forEach(file => {
            // Make sure to only load files ending with .js
            if (file.endsWith('.js')) {
                try {
                    const command = require(path.join(__dirname, 'commands', file));
                    if (command.name) {
                        readlineCommands[command.name] = command;
                        debugWithTimestamp(`[Readline] Loaded command ${command.name}`);
                    } else {
                        warnWithTimestamp(`[Readline] Command in ${file} does not have a 'name' property.`);
                    }
                } catch (err) {
                    errorWithTimestamp(`[Readline] Error loading command from ${file}: ${err}`);
                }
            }
        });
    } catch (err) {
        errorWithTimestamp('[Readline] Error reading commands directory:', err);
    }

    logWithTimestamp('[Readline] Loaded all commands');
    return readlineCommands;
};

let rl;

module.exports = {
    start(client) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
            prompt: '> '
        });

        const commands = loadReadlineCommands();

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
                    errorWithTimestamp(`[Readline] ${err}`);
                }
            } else {
                errorWithTimestamp(`[Readline] Unknown command: ${cmdName}`);
            }

            rl.prompt();
        });

        rl.on('close', () => {
            process.exit(0);
        });

        rl.prompt();
        global.rl = rl;
    },
    crash() {
        if (rl) {
            logger.log('fatal', '[Console] Readline closed dues to a fatal error');
            rl.close();
        }
    },
    stop() {
        if (rl) {
            logWithTimestamp('[Console] Readline closed');
            rl.close();
        }
    }
};