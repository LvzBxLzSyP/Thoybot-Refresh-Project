const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('返回機器人的延遲')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    info: {
        short: '返回機器人的延遲',
        full: `返回機器人的websocket延遲，可使用按鈕重新測試
        命令使用語法:
        \`/ping\``
    },
    enabled: true,
    async execute(interaction) {
        // 使用隨機顏色初始化 Ping 值
        const pingEmbed = new EmbedBuilder()
            .setColor(getRandomColor())
            .setTitle('Ping 訊息')
            .setDescription(`延遲為 ${interaction.client.ws.ping}ms`);

        // 創建按鈕
        const button = new ButtonBuilder()
            .setCustomId('ping_button')
            .setLabel('重新 Ping')
            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(button);

        // 發送嵌入訊息和按鈕
        await interaction.reply({ embeds: [pingEmbed], components: [row] });
    },
};