const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

/**
 * `/help` command module
 * @module help
 */
module.exports = {
    /**
     * Sets the command's data definition.
     * @returns {SlashCommandBuilder} The SlashCommandBuilder object that defines the structure of the command
     */
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Send a help message and provide a command selection menu')
        .setContexts(0, 1, 2) // The available context ranges for the command
        .setIntegrationTypes(0, 1), // The available integration types for the command

    /**
     * Command's short and full descriptions
     * @type {Object}
     * @property {string} short - A brief description of the command
     * @property {string} full - A detailed description of the command
     */
    info: {
        short: 'Send a help message with a list of commands',
        full: `Send a help message. You can select any option from the dropdown to view its usage and command name.
        Command syntax:
        \`/help\``
    },

    /**
     * Command enable status
     * @type {boolean}
     */
    enabled: true,

    /**
     * Executes the `/help` command logic.
     * @async
     * @function
     * @param {import('discord.js').Interaction} interaction - The interaction object from Discord
     * @returns {Promise<void>} A Promise that resolves with no value
     */
    async execute(interaction) {
        // Create the help message embed
        const helpEmbed = new EmbedBuilder()
            .setTitle('Bot Commands')
            .setDescription('Select a command from the dropdown menu below for details.')
            .setColor(getRandomColor()); // Use the global getRandomColor function for random colors

        // Build the menu options for the commands
        const menuOptions = [
            // Add options for all available commands
            ...Object.keys(interaction.client.commandInfo).map(commandName => {
                const commandInfo = interaction.client.commandInfo[commandName];
                return new StringSelectMenuOptionBuilder()
                    .setLabel(commandName)
                    .setValue(commandName)
                    .setDescription(commandInfo.short || 'No description available');
            }),
            // Add an option to close the menu
            new StringSelectMenuOptionBuilder()
                .setLabel('Close Menu')
                .setValue('close')
                .setDescription('Close the help menu')
        ];

        // Create the select menu
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Choose a command to view details')
            .addOptions(menuOptions);

        // Create an ActionRow to wrap the select menu
        const row = new ActionRowBuilder().addComponents(selectMenu);

        // Send the main command reply message with the embed and components
        await interaction.reply({ content: 'Here you go!', embeds: [helpEmbed], components: [row] });
    }
};