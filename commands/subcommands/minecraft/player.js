const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('player')
        .setDescription ('bruh'),
    enabled: false,
    async execute(interaction) {
        warnWithTimestamp('do this fast');
    }
};