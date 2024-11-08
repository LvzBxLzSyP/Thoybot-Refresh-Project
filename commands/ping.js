const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// 隨機生成顏色的函數
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
        .setName('ping')
        .setDescription('返回機器人的延遲。')
        .setIntegrationTypes(0, 1),
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
        if (!interaction.channel) {
            await interaction.reply({ embeds: [pingEmbed] });
            return;
        } else {
            await interaction.reply({ embeds: [pingEmbed], components: [row] });
        }

        const filter = i => i.customId === 'ping_button' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            await i.deferUpdate(); // 确认按钮互动，避免重复回复

            const newPingEmbed = new EmbedBuilder()
                    .setColor(getRandomColor()) // 每次更新使用隨機顏色
                    .setTitle('Ping 訊息')
                    .setDescription(`延遲為 ${interaction.client.ws.ping}ms`);

            // 更新嵌入訊息
            await i.editReply({ embeds: [newPingEmbed] }); // 使用 editReply 更新交互回复
        });

        collector.on('end', async collected => {
                // 當按鈕收集器結束後，禁用按鈕
                row.components[0].setDisabled(true);
                await interaction.editReply({ components: [row] }); // 确保在这里使用 await
        });
    }
};