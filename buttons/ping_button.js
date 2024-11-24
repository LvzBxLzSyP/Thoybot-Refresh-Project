const { EmbedBuilder } = require('discord.js');

module.exports = {
    customId: ['ping_button'], // 對應按鈕 ID
    async execute(interaction) {
        // 防止非互動發起者使用按鈕
        if (interaction.user.id !== interaction.message.interaction.user.id) {
            return interaction.reply({ content: '這不是你的按鈕！', ephemeral: true });
        }

        // 確認按鈕互動
        await interaction.deferUpdate();

        // 更新嵌入訊息
        const newPingEmbed = new EmbedBuilder()
            .setColor(global.getRandomColor()) // 使用全局定義的 getRandomColor
            .setTitle('Ping 訊息')
            .setDescription(`延遲為 ${interaction.client.ws.ping}ms`);

        await interaction.editReply({ embeds: [newPingEmbed] }); // 更新訊息
    },
};