const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fetch = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nethergames')
        .setDescription('Search Nethergames Things')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addSubcommand(subcommand =>
            subcommand
                .setName('player')
                .setDescription('Search Players')
                .addStringOption(option =>
                    option.setName('ign')
                        .setDescription('Minecraft Player In-Game-Name')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('guild')
                .setDescription('Search Guild')
                .addStringOption(option =>
                    option.setName('guild')
                        .setDescription('Guild Name')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('faction')
                .setDescription('Search Faction')
                .addStringOption(option =>
                    option.setName('faction')
                        .setDescription('Faction Name')
                        .setRequired(true)
                )
        ),
    async execute(interaction) {
        
    }
};