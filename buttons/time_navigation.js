const { EmbedBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
    customId: ['time_previous', 'time_next'], // 支援多個 customId
    async execute(interaction, client) {
        const pageNumber = interaction.customId.split('_')[1]; // 獲取動態部分（頁碼）
        const ITEMS_PER_PAGE = 25;
        const timezones = require('moment-timezone').tz.names();
        const totalPages = Math.ceil(timezones.length / ITEMS_PER_PAGE);
        
        await interaction.deferUpdate();

        // 根據按鈕 ID 決定頁碼的增減
        let currentPage = parseInt(interaction.customId.split('_')[2]);
        if (interaction.customId.startsWith('time_previous') && currentPage > 0) {
            currentPage--;
        } else if (interaction.customId.startsWith('time_next') && currentPage < totalPages - 1) {
            currentPage++;
        }

        // 建立嵌入訊息
        const embed = new EmbedBuilder()
            .setTitle('世界各地的時間')
            .setDescription(`這是第 ${currentPage + 1} 頁，共 ${totalPages} 頁:`)
            .setColor(global.getRandomColor());

        embed.addFields(
            timezones
                .slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
                .map(tz => {
                    const time = require('moment-timezone').tz(tz);
                    return {
                        name: `${tz}`,
                        value: `${getClockEmoji(time)} ${time.format('YYYY-MM-DD HH:mm:ss')}`,
                        inline: false,
                    };
                })
        );

        // 建立按鈕
        const { createButtons } = require('../utils/loadUtils.js');
        await interaction.editReply({
            embeds: [embed],
            components: [createButtons(currentPage, totalPages)],
        });
    },
};