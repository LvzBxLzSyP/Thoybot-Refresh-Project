module.exports = {
    name: 'reload',
    description: 'Reload readline commands or bot components',
    
    async execute(rl, client, args) {
        const subcommand = args[0];
        
        if (!subcommand) {
            logWithTimestamp('Usage: reload <readline|bot>');
            logWithTimestamp('  readline - Reload readline commands only');
            logWithTimestamp('  bot      - Reload bot components (requires moduleLoader)');
            return;
        }
        
        try {
            switch (subcommand.toLowerCase()) {
                case 'readline':
                case 'rl':
                    logWithTimestamp('Reloading readline commands...');
                    const result = global.consoleAdapter.reload();
                    if (result.success) {
                        logWithTimestamp(`Reloaded ${result.count} readline commands`);
                    } else {
                        logWithTimestamp('Failed to reload readline commands');
                    }
                    break;
                    
                case 'bot':
                case 'all':
                    logWithTimestamp('Reloading bot components...');
                    const { reloadAllComponents } = require('../../utils/moduleLoader');
                    const botResult = await reloadAllComponents(client, __projname, {
                        registerCommands: false,
                        loadReadlineCommands: false // Do not reload the readline command
                    });
                    logWithTimestamp(`Bot components reloaded!`);
                    logWithTimestamp(`   Commands: ${botResult.commandsCount}`);
                    logWithTimestamp(`   Buttons: ${botResult.buttonsCount}`);
                    logWithTimestamp(`   Select Menus: ${botResult.selectMenusCount}`);
                    break;
                    
                default:
                    logWithTimestamp(`Unknown option: ${subcommand}`);
                    logWithTimestamp('Available: readline, bot');
            }
        } catch (error) {
            errorWithTimestamp(`[Readline] Reload error: ${error.message}`);
            console.error(`Error: ${error.message}`);
        }
    }
};