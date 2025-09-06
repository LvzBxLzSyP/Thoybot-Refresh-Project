const { SlashCommandBuilder } = require('discord.js');
const serverCommand = require('./subcommands/minecraft/server');
const playerCommand = require('./subcommands/minecraft/player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minecraft')
        .setDescription('Almost everything about minecraft')
        .setContexts(0, 1, 2) // The available context ranges for the command
        .setIntegrationTypes(0, 1), // The available integration types for the command
    subcommands: [
        playerCommand,
        serverCommand
    ],
    enabled: true,
    async execute(interaction) {
        await interaction.deferReply();
        const subcmd = interaction.options.getSubcommand(); // Get the subcommand chosen by the user.

        // Find the corresponding handler for the selected subcommand.
        const subcommandHandler = this.subcommands.find(cmd => cmd.data.name === subcmd);

        // If a corresponding subcommand handler is found, execute its command.
        if (subcommandHandler) {
            await subcommandHandler.execute(interaction);
        } else {
            // If no subcommand is found, reply with an error message.
            await interaction.editReply({ content: 'Subcommand Not Found!' });
        }
    }
};