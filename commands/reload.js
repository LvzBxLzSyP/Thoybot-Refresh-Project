const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    // Data that defines the Slash command
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reload a specific command.')
        .addStringOption(option =>
            option.setName('command')
                .setDescription('Command name to reload')
                .setRequired(true)
        ),

    // Handle command execution logic
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Check if the user is an administrator (check ownerId)
        if (interaction.user.id !== config.ownerId) {
            return interaction.editReply({ content: 'You do not have permission to reload commands!' });
        }

        // Get the name of the command to be reloaded   
        const commandName = interaction.options.getString('command');
        const commandPath = path.join(__dirname, '../commands', `${commandName}.js`);

        // Check if the command exists
        if (!fs.existsSync(commandPath)) {
            return interaction.editReply({ content: `Command ${commandName} not found.`, ephemeral: true });
        }

        // Log: record who is reloading the command
        warnWithTimestamp(`[Command] Command ${commandName} is being reloaded by ${interaction.user.username} using reload command`);

        try {
            // Delete old command module cache
            delete require.cache[require.resolve(commandPath)];

            // Reload the specified command
            const command = require(commandPath);

            // Update client.commands
            interaction.client.commands.set(command.data.name, command);

            // If the command contains info, insert it into client.commandInfo
            if (command.info) {
                interaction.client.commandInfo[command.data.name] = command.info;
            }

            // Log: Reload successful
            logWithTimestamp(`[Command] Command ${commandName} was successfully reloaded`);

            // Return a successful response
            return interaction.editReply({ content: `Command ${commandName} has been reloaded successfully!` });
        } catch (error) {
            // Catching errors and responding
            console.error(error);
            return interaction.editReply({ content: `An error occurred while reloading the command: ${error.message}`, ephemeral: true });
        }
    }
};