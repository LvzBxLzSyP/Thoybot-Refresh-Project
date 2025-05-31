const { SlashCommandBuilder } = require('discord.js');
const playerCommand = require('./subcommands/nethergames/player');
const guildCommand = require('./subcommands/nethergames/guild');
const factionCommand = require('./subcommands/nethergames/faction');

/**
 * `/nethergames` main command module
 * Used to query information from the NetherGames API.
 * @module nethergames
 */
module.exports = {
    /**
     * Defines the structure of the command.
     * @returns {SlashCommandBuilder} Returns a SlashCommandBuilder object defining the structure of the command.
     */
    data: new SlashCommandBuilder()
        .setName('nethergames')
        .setDescription('Search Nethergames Things')
        .setContexts(0, 1, 2) // Optional context ranges
        .setIntegrationTypes(0, 1), // Available integration types

    /**
     * Subcommands handlers for this command.
     * @type {Array}
     * @property {Object} playerCommand - Handles player query commands.
     * @property {Object} guildCommand - Handles guild query commands.
     * @property {Object} factionCommand - Handles faction query commands.
     */
    subcommands: [
        playerCommand,
        guildCommand,
        factionCommand
    ],

    /**
     * Short and full descriptions of the command.
     * @type {Object}
     * @property {string} short - A brief description of the command.
     * @property {string} full - A detailed description of the command usage and examples.
     */
    info: {
        short: 'Query players, guilds, and factions from NGMC API.',
        full: `Use the NetherGames API to query brief information about players, guilds, and factions.
        Command usage syntax:
        \`/nethergames player <ign:username> [hide:False|True] (Guild mode defaults to false, User mode defaults to true)\`
        \`/nethergames guild <guild:guild_name> [hide:False|True] [showlink:False|True]\`
        \`/nethergames faction <faction:faction_name> [hide:False|True]\`
        
        Example usage:
        \`/nethergames player ign:Herobrine90199\`
        \`/nethergames guild guild:MEOWOWO hide:False showlink:False\`
        \`/nethergames faction faction:Fly hide:True\``
    },

    /**
     * Defines whether the command is enabled or not.
     * @type {boolean}
     */
    enabled: config.ngmcEnabled,

    /**
     * Executes the `/nethergames` command logic.
     * @async
     * @function
     * @param {import('discord.js').Interaction} interaction - The interaction object from Discord.
     * @returns {Promise<void>} Returns a Promise with no value, handles the execution of the command.
     */
    async execute(interaction) {
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