const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('發送指定的訊息')
        .setIntegrationTypes(0, 1)
        .addStringOption(option => 
            option.setName('message')
                .setDescription('要發送的訊息內容')
                .setRequired(true)),
    async execute(interaction) {
        const messageContent = interaction.options.getString('message');
        if (!interaction.channel) {
            await interaction.reply(messageContent);
        } else {
            await interaction.reply({ content: '正在發送訊息...', ephemeral: true });
            await interaction.channel.send(messageContent);
        }
    },
};