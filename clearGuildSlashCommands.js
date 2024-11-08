const { REST, Routes } = require('discord.js');
const config = require('./config.json');

// 從命令列參數讀取 guildId
const guildId = process.argv[2]; // 第三個參數應為 guildId
if (!guildId) {
    console.error('請提供 guildId 作為命令列參數，例如：node clearGuildCommands.js <guildId>');
    process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log(`Started clearing commands for guild: ${guildId}`);

        await rest.put(
            Routes.applicationGuildCommands(config.clientId, guildId),
            { body: [] }
        );

        console.log('Successfully cleared commands for the specified guild.');
    } catch (error) {
        console.error('Error clearing guild commands:', error);
    }
})();
