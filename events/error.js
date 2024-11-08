const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: 'error',
    once: false,
    execute(error, client) {
        console.error('Discord Client Error:', error);

        const errorEmbed = new EmbedBuilder()
            .setTitle('Bot 錯誤')
            .setDescription(`發生了一個錯誤：\n\`\`\`${error.message}\`\`\``)
            .setColor(0xFF0000)
            .setTimestamp()
            .setFooter({ text: '快點修掉這個Bug!' });

        const errorChannel = client.channels.cache.get(config.errorChannelId);
        if (errorChannel) {
            errorChannel.send({ embeds: [errorEmbed] }).catch(console.error);
        }
    },
};