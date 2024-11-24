const { EmbedBuilder } = require('discord.js');

/**
 * Handles button interactions and updates the ping message.
 * @module ping_button
 */
module.exports = {
    customId: ['ping_button'], // Button ID associated with the interaction

    /**
     * Executes when the user presses the "ping_button" button.
     * 
     * @param {import('discord.js').Interaction} interaction - The interaction event from the user
     * @returns {Promise<void>} - No return value
     */
    async execute(interaction) {
        // Prevent users other than the one who initiated the interaction from using the button
        if (interaction.user.id !== interaction.message.interaction.user.id) {
            return interaction.reply({ content: 'This is not your button!', ephemeral: true });
        }

        // Acknowledge the button interaction
        await interaction.deferUpdate();

        // Create a new embed message with the updated ping information
        const newPingEmbed = new EmbedBuilder()
            .setColor(global.getRandomColor())  // Use the global getRandomColor function for a random color
            .setTitle('Ping Message')  // Title of the embed
            .setDescription(`The latency is ${interaction.client.ws.ping}ms`);  // Description with the current WebSocket ping

        // Update the original message with the new embed
        await interaction.editReply({ embeds: [newPingEmbed] });
    }
};