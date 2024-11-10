const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

function sendErrorEmbed(client, errorTitle, errorDescription) {
    const errorEmbed = new EmbedBuilder()
        .setTitle(errorTitle)
        .setDescription(`\`\`\`${errorDescription}\`\`\``)
        .setColor(0xFF0000)
        .setTimestamp()
        .setFooter({ text: '快點修掉這個Bug!' });

    const errorChannel = client.channels.cache.get(config.errorChannelId);
    if (errorChannel) {
        errorChannel.send({ embeds: [errorEmbed] }).catch(console.error);
    }
}

// 捕获未处理的 Promise 拒绝
process.on('unhandledRejection', (reason, promise) => {
    console.error('未處理的 Promise 拒絕：', promise, '原因：', reason);
    sendErrorEmbed(global.client, '未處理的 Promise 拒絕', reason);
});

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
    console.error('未處理的異常：', error);
    sendErrorEmbed(global.client, '未處理的異常', error.message);
});

// 事件处理错误
module.exports = {
    name: 'error',
    once: false,
    execute(error, client) {
        console.error('Discord Client 錯誤:', error);
        sendErrorEmbed(client, 'Bot 錯誤', error.message);
    },
};
