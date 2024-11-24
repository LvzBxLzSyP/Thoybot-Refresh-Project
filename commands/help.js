const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Sent help message')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    info: {
        short: '發送幫助訊息，以列表方式回應',
        full: `發送幫助訊息，你可以選擇選單的任何一個回應，會使用臨時訊息回覆命令名稱和用法
        命令使用語法:
        \`/help\``
    },
    enabled: true,
    async execute(interaction) {
        const helpEmbed = new EmbedBuilder()
            .setTitle('Bot Commands')
            .setDescription('Select a command from the dropdown menu below for details.')
            .setColor(getRandomColor());

        // 添加關閉選單選項
        const menuOptions = [
            ...Object.keys(interaction.client.commandInfo).map(commandName => {
                const commandInfo = interaction.client.commandInfo[commandName];
                return new StringSelectMenuOptionBuilder()
                    .setLabel(commandName)
                    .setValue(commandName)
                    .setDescription(commandInfo.short || 'No description available');
            }),
            new StringSelectMenuOptionBuilder()
                .setLabel('Close Menu')
                .setValue('close')
                .setDescription('Close the help menu')
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Choose a command to view details')
            .addOptions(menuOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // 發送主命令的回覆消息
        await interaction.reply({ content: 'Here you go!', embeds: [helpEmbed], components: [row] });
    }
};