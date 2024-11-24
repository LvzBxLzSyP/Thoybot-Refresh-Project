const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const createButtons = (page, totalPages) => {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`time_previous_${page}`)
                .setLabel('上一頁')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`time_next_${page}`)
                .setLabel('下一頁')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages - 1)
        );
};

module.exports = { createButtons };