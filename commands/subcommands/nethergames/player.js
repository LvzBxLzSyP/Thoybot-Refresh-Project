const { EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js');
const { get } = require('axios');
const config = require('../../../config.json');

// Headers for making API requests to NGMC
const headers = {
    'Authorization': config.ngmcApiKey,  // API key for authentication
    'Content-Type': 'application/json'   // Content type for the request
};

/**
 * Generates a random hex color
 * 
 * @returns {string} A random hex color code (e.g. '#A1B2C3')
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('player')  // Command name
        .setDescription('Search Players')  // Command description
        .addStringOption(option =>  // Adding IGN option for player search
            option.setName('ign')  // Option name
                .setDescription('Minecraft Player In-Game-Name')  // Option description
                .setRequired(true)  // Marking as required
        )
        .addBooleanOption(option =>  // Adding hide option to decide if the message should be ephemeral
            option.setName('hide')
                .setDescription('Hiding this message (too long!)')
        ),
    enabled: true,  // Enables this command

    /**
     * Handles the execution of the 'player' command
     * Fetches player data from NGMC API and sends it as an embedded message
     * 
     * @param {import('discord.js').Interaction} interaction - The interaction object from Discord
     * @returns {Promise<void>} No return value
     */
    async execute(interaction) {
        const pname = interaction.options.getString('ign');  // Minecraft player's in-game name (IGN)
        const hide = interaction.options?.getBoolean('hide') ?? !interaction.channel;  // Determines if the message is hidden or not

        await interaction.deferReply({ ephemeral: hide });  // Defers the reply, based on the hide option

        try {
            // Fetch player data from the NGMC API
            const { data: results } = await get(`https://api.ngmc.co/v1/players/${pname}`, { headers });

            // Create an embedded message with the player's information
            const playerEmbed = new EmbedBuilder()
                .setTitle(`Player info: ${pname}`)
                .setColor(getRandomColor())  // Set a random color for the embed
                .addFields(
                    { name: 'Bio', value: results.bio || 'Player has not set bio, tell them to set one!' }  // Display the player's bio
                )
                .setThumbnail(results.avatar)  // Display the player's avatar
                .setTimestamp()  // Add the timestamp of the request
                .setFooter({ text: 'API by NGMC Official', iconURL: interaction.user.displayAvatarURL() });  // Footer with user avatar

            await interaction.editReply({ embeds: [playerEmbed] });  // Edit the reply with the generated embed

        } catch (error) {
            if (error.response && error.response.status === 404) {
                await interaction.editReply({ content: 'Player not found' });  // Player not found in the database
            } else {
                errorWithTimestamp('Error fetching player info:', error);
                await interaction.editReply({ content: 'Error fetching player info. Please try later!' });  // Generic error message
            }
        }
    }
};