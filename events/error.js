const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function sendErrorEmbed(client, errorTitle, errorDescription) {
    const errorEmbed = new EmbedBuilder()
        .setTitle(errorTitle)
        .setDescription(`\`\`\`${String(errorDescription)}\`\`\``) // 保證為字符串
        .setColor(0xFF0000)
        .setTimestamp()
        .setFooter({ text: '快點修掉這個Bug!' });

    const errorChannel = client.channels.cache.get(config.errorChannelId);
    if (errorChannel) {
        errorChannel.send({ embeds: [errorEmbed] }).catch(console.error);
    }
}

// 捕捉未處理的 Promise 拒絕
process.on('unhandledRejection', (reason, promise) => {
    console.error('未處理的 Promise 拒絕：', promise, '原因：', reason);
    sendErrorEmbed(global.client, '未處理的 Promise 拒絕', reason);
});

// 捕捉未處理的異常
process.on('uncaughtException', (error) => {
    console.error('未處理的異常：', error);
    sendErrorEmbed(global.client, '未處理的異常', error.message);
});

// 事件處理錯誤
module.exports = {
    name: 'error',
    once: false,
    execute(error, client) {
        console.error('Discord Client 錯誤:', error);
        sendErrorEmbed(client, 'Bot 錯誤', error.message);
    },
};