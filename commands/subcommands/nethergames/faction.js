const { SlashCommandSubcommandBuilder } = require('discord.js');

/**
 * `/nethergames faction` subcommand module
 * Used to query faction information from the NetherGames API.
 * @module faction
 */
module.exports = {
    /**
     * Defines the structure of the `/nethergames faction` subcommand.
     * @returns {SlashCommandSubcommandBuilder} Returns a SlashCommandSubcommandBuilder object defining the subcommand structure.
     */
    data: new SlashCommandSubcommandBuilder()
        .setName('faction')
        .setDescription('Search Faction')
        .addStringOption(option =>
            option.setName('faction')
                .setDescription('Faction Name')
                .setRequired(true) // Makes the faction argument required
        )
        .addBooleanOption(option =>
            option.setName('hide')
                .setDescription('Hiding this message (too long!)') // Optional argument for hiding messages if they are too long
        ),

    /**
     * Flag to enable or disable the subcommand.
     * @type {boolean}
     */
    enabled: false,

    /**
     * Executes the logic for the `/nethergames faction` subcommand.
     * @async
     * @function
     * @param {import('discord.js').Interaction} interaction - The interaction object from Discord.
     * @returns {Promise<void>} Returns a Promise with no value, currently just sends a placeholder message.
     */
    async execute(interaction) {
        // Placeholder message indicating the subcommand is not yet implemented
        await interaction.editReply({ content: 'I am not done yet' });
    }
};