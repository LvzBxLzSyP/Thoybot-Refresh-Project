const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

/**
 * Command to fetch and display the bot's ping with the option to refresh the ping value.
 * @module ping
 */
module.exports = {
    /**
     * Command data definition for the `/ping` command.
     * Returns the bot's websocket ping with an option to refresh it using a button.
     * 
     * @returns {SlashCommandBuilder} The command builder for the /ping command.
     */
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Delay in returning bot') // Command description
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    /**
     * Command information including a short and full description.
     */
    info: {
        short: 'Delay in returning bot', // Short description
        full: `Returns the bot's websocket delay, which can be retested using the button
        Command usage syntax:
        \`/ping\``
    },

    /**
     * Whether the command is enabled.
     */
    enabled: true,

    /**
     * Executes the command to fetch the bot's ping and create an embed with a button to refresh it.
     * 
     * @param {import('discord.js').CommandInteraction} interaction The interaction object from Discord.js.
     * @returns {Promise<void>} 
     */
    async execute(interaction) {
        // Set up the ping message with a random color
        const pingEmbed = new EmbedBuilder()
            .setColor(getRandomColor()) // Set a random color for the embed
            .setTitle('Ping message') // Title of the embed
            .setDescription(`The latency is ${interaction.client.ws.ping}ms`); // Display the bot's ping (websocket latency)

        // Create a button to refresh the ping
        const button = new ButtonBuilder()
            .setCustomId('ping_button') // Custom ID for the button to identify it
            .setLabel('Re-Ping') // Button label in Chinese
            .setStyle(ButtonStyle.Primary); // Style the button as primary (blue)

        // Create a row to hold the button
        const row = new ActionRowBuilder().addComponents(button);

        // Send the embed and button as a response to the interaction
        await interaction.reply({ embeds: [pingEmbed], components: [row] });
    },
};