const { SlashCommandSubcommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('faction')
        .setDescription('Search Faction')
        .addStringOption(option =>
            option.setName('faction')
                .setDescription('Faction Name')
                .setRequired(true)
        )
        .addBooleanOption(option =>
            option.setName('hide')
                .setDescription('Hiding this message (too long!)')
        ),

    async execute(interaction) {
        await interaction.editReply({ content: 'I am not done yet' });
    }
};