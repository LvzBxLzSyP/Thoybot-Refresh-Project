const { REST, Routes } = require('discord.js');
const config = require('./config.json');

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
    try {
        console.log('Started clearing global (/) commands.');

        await rest.put(Routes.applicationCommands(config.clientId), { body: [] });

        console.log('Successfully cleared global (/) commands.');
    } catch (error) {
        console.error('Error clearing global commands:', error);
    }
})();
