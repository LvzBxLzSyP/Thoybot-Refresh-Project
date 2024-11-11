const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('發送指定的訊息')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addStringOption(option => 
            option.setName('message')
                .setDescription('要發送的訊息內容')
                .setRequired(true)),
    info: {
        short: '讓機器人說出你要說的',
        full: `讓機器人發送你的訊息
        命令使用語法:
        \`/say <message:你要說的>\`
        使用例:
        \`/say message: Hello World!\``
    },
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