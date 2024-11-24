const { EmbedBuilder } = require('discord.js');

/**
 * Button interaction command handler module
 * @module helpMenu
 */

/**
 * Handles interaction requests and generates responses
 * 
 * @param {import('discord.js').Interaction} interaction - The interaction object from Discord
 * @returns {Promise<void>} No return value
 */
module.exports = {
    data: {
        custom_id: 'help_menu', // Custom ID for the menu
    },

    /**
     * Executes the command and displays detailed information about the selected command or closes the menu
     * 
     * @param {import('discord.js').Interaction} interaction - The interaction object from Discord
     * @returns {Promise<void>} No return value
     */
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        // Get the selected command from the interaction
        const selectedCommand = interaction.values[0];

        // If the selected command is to close the menu
        if (selectedCommand === 'close') {
            await interaction.update({ content: 'Select menu closed', components: [] });
            await interaction.followUp({ content: 'Select menu closed', ephemeral: true });
            return;
        }

        // Get the corresponding command handler for the selected command
        const command = interaction.client.commands.get(selectedCommand);

        // If the command is found, display detailed information about the command
        if (command) {
            const commandEmbed = new EmbedBuilder()
                .setTitle(`Command: ${selectedCommand}`)
                .setDescription(command.info?.full || command.data.description || 'No detailed information available')
                .setColor(getRandomColor());

            await interaction.followUp({ embeds: [commandEmbed], ephemeral: true });
        } else {
            // If the command is not found, display an error message
            await interaction.followUp({ content: 'Command not found.', ephemeral: true });
        }
    },
};

/**
 * Generates a random color for the embed
 * 
 * @returns {string} A random hex color code
 */
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}