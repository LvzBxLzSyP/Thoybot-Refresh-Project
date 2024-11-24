const { EmbedBuilder } = require('discord.js');
const { getRandomColor } = require('../utils/getRandomColor'); // 正确的相对路径

module.exports = {
    data: {
        custom_id: 'help_menu',
    },

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const selectedCommand = interaction.values[0];

        if (selectedCommand === 'close') {
            await interaction.update({ content: 'Select menu closed', components: [] });
            await interaction.followUp({ content: 'Select menu closed', ephemeral: true });
            return;
        }

        const command = interaction.client.commands.get(selectedCommand);

        if (command) {
            const commandEmbed = new EmbedBuilder()
                .setTitle(`Command: ${selectedCommand}`)
                .setDescription(command.info?.full || command.data.description || 'No detailed information available')
                .setColor(getRandomColor());

            await interaction.followUp({ embeds: [commandEmbed], ephemeral: true });
        } else {
            await interaction.followUp({ content: 'Command not found.', ephemeral: true });
        }
    },
};