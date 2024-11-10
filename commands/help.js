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
        .setIntegrationTypes(0, 1),
    async execute(interaction) {
        const client = interaction.client;
        const commandNames = [...client.commands.keys()];

        const helpEmbed = new EmbedBuilder()
            .setTitle('Bot commands')
            .setDescription('Select a command from the dropdown menu below for details.')
            .setColor(getRandomColor());

        // 創建選單選項
        const menuOptions = commandNames.map(command =>
            new StringSelectMenuOptionBuilder()
                .setLabel(command)
                .setValue(command)
        );

        // 創建 StringSelectMenuBuilder 並添加選項
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('Choose a command to view details')
            .addOptions(menuOptions);

        // 創建 ActionRow 並包含選單
        const row = new ActionRowBuilder()
            .addComponents(selectMenu);

        // 發送消息並包含嵌入和選單
        await interaction.reply({ content: 'Here you go!', embeds: [helpEmbed], components: [row] });

        // 使用全局事件監聽器捕獲所有選單互動
        client.on('interactionCreate', async i => {
            if (!i.isSelectMenu()) return;
            if (i.customId === 'help_menu' && i.user.id === interaction.user.id) {
                const selectedCommand = i.values[0];
                const command = client.commands.get(selectedCommand);

                if (command) {
                    const commandEmbed = new EmbedBuilder()
                        .setTitle(`Command: ${selectedCommand}`)
                        .setDescription(command.data.description || 'No description available')
                        .setColor(getRandomColor());

                    await i.update({ embeds: [commandEmbed], components: [row] });
                }
            }
        });
    }
};
