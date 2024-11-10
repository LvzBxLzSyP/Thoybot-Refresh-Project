const { SlashCommandBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Bot commands help")
        .setContexts(0, 1, 2)
        .setIntegrationTypes (0, 1),
    async execute(interaction) {
        const commandNames = [...interaction.client.commands.keys()];

        const helpEmbed = new EmbedBuilder()
            .setTitle('Bot commands')
            .setDescription('Select a command from the dropdown menu below for details.')
            .setColor(getRandomColor());

        // 添加关闭选单选项
        const menuOptions = [
            ...commandNames.map(command =>
                new StringSelectMenuOptionBuilder()
                    .setLabel(command)
                    .setValue(command)
            ),
            new StringSelectMenuOptionBuilder()
                .setLabel('Close Menu')
                .setValue('close')
                .setDescription('Close the help menu')
        ];

        // 创建菜单
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Choose a command to view details')
            .addOptions(menuOptions);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        // 发出主命令的回复消息
        await interaction.reply({ content: 'Here you go!', embeds: [helpEmbed], components: [row] });
    }
};