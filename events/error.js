const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

/**
 * Sends an error message embedded card to a specified channel.
 * @param {import('discord.js').Client} client - The Discord client instance.
 * @param {string} errorTitle - The error title.
 * @param {string} errorDescription - The error description content.
 */
function sendErrorEmbed(client, errorTitle, errorDescription) {
    const errorEmbed = new EmbedBuilder()
        .setTitle(errorTitle)
        .setDescription(`\`\`\`${String(errorDescription)}\`\`\``) // Ensure it's a string
        .setColor(0xFF0000)
        .setTimestamp()
        .setFooter({ text: 'Fix this bug quickly!' });

    const errorChannel = client.channels.cache.get(config.errorChannelId);
    if (errorChannel) {
        errorChannel.send({ embeds: [errorEmbed] }).catch(errorWithTimestamp);
    }
}

// Capture unhandled Promise rejections
process.on('unhandledRejection', (reason, promise) => {
    errorWithTimestamp('Unhandled Promise Rejection:', promise, 'Reason:', reason);
    // Ensure the client object is passed
    if (global.client) sendErrorEmbed(global.client, 'Unhandled Promise Rejection', reason);
});

// Capture uncaught exceptions
process.on('uncaughtException', (error) => {
    errorWithTimestamp('Unhandled Exception:', error);
    // Ensure the client object is passed
    if (global.client) sendErrorEmbed(global.client, 'Unhandled Exception', error.message);
});

/**
 * Handles the Discord client error event and sends an error message embedded card.
 * @param {Error} error - The error that occurred.
 * @param {import('discord.js').Client} client - The Discord client instance.
 */
module.exports = {
    name: 'error',
    once: false,
    execute(error, client) {
        errorWithTimestamp('Discord Client Error:', error);
        try {
            sendErrorEmbed(client, 'Bot Error', error.message);
        } catch (err) {
            errorWithTimestamp('Error occurred while sending the error message:', err);
        }
    },
};