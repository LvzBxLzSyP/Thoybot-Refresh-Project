const { REST, Routes } = require('discord.js');
const config = require('./config.json');

// Read guildId from command line parameters
const guildId = process.argv[2]; // The third parameter should be guildId
if (!guildId) {
    console.error('Please provide guildId as command line parameter, for example: node clearGuildCommands.js <guildId>');
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
