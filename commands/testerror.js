const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testerror')
        .setDescription('test error'),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerId) {
            await interaction.reply({ content: 'You have not permission to run this command.' });
            return;
        }

        try {
            // 故意拋出一個錯誤來測試錯誤處理
            throw new Error('a test error happens');

        } catch (error) {
            // 捕獲錯誤並將錯誤信息發送到錯誤處理系統
            console.error('test errors:', error);

            // 創建錯誤訊息的Embed
            const errorEmbed = new EmbedBuilder()
                .setTitle('Bot error')
                .setDescription(`Happens test error：\n\`\`\`${error.message}\`\`\``)
                .setColor(0xFF0000)
                .setTimestamp()
                .setFooter({ text: 'This is test error, so you can skip it' });

            // 發送錯誤訊息到指定的頻道（假設已經設置好 config）
            const errorChannel = interaction.client.channels.cache.get(config.errorChannelId);
            if (errorChannel) {
                errorChannel.send({ embeds: [errorEmbed] }).catch(console.error);
            }

            // 回覆用戶錯誤已發生
            await interaction.reply({
                content: 'An error occurred, we have reported it to the administrator',
                ephemeral: true,
            });
        }
    }
};
