module.exports = {
    name: 'help',
    description: 'Show available commands',
    
    execute(rl, client, args) {
        const commands = global.consoleAdapter.getCommands();
        
        logWithTimestamp('📋 Available Readline Commands:');
        logWithTimestamp('═'.repeat(50));
        
        Object.entries(commands).forEach(([name, cmd]) => {
            const desc = cmd.description || 'No description';
            logWithTimestamp(`  ${name.padEnd(15)} - ${desc}`);
        });
        
        logWithTimestamp('═'.repeat(50));
        logWithTimestamp(`Total: ${Object.keys(commands).length} commands`);
    }
};