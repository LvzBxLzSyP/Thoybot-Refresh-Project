module.exports = {
    name: 'status',
    description: 'Show bot status and statistics',
    
    execute(rl, client, args) {
        logWithTimestamp('Bot Status');
        logWithTimestamp('═'.repeat(50));
        logWithTimestamp(`Bot User: ${client.user?.tag || 'Not logged in'}`);
        logWithTimestamp(`Guilds: ${client.guilds.cache.size}`);
        logWithTimestamp(`Users: ${client.users.cache.size}`);
        logWithTimestamp(`Commands: ${client.commands?.size || 0}`);
        logWithTimestamp(`Buttons: ${client.buttons?.size || 0}`);
        logWithTimestamp(`Select Menus: ${client.selectMenus?.size || 0}`);
        logWithTimestamp(`Uptime: ${Math.floor(client.uptime / 1000 / 60)} minutes`);
        
        const memUsage = process.memoryUsage();
        logWithTimestamp(`Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        logWithTimestamp('═'.repeat(50));
    }
};