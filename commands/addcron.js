const { SlashCommandBuilder } = require('discord.js');
const cron = require('node-cron');
const moment = require('moment'); // 確保安裝 moment.js: npm install moment

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcron')
        .setDescription('設置提醒，單次或每日提醒')
        .setContexts(0)
        .addStringOption(option => 
            option.setName('datetime')
                .setDescription('請輸入提醒的日期和時間，例如 "2024/11/02 11:40" 或 "11:40" 代表每日提醒')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('要在指定時間提醒的訊息')
                .setRequired(true)),
    async execute(interaction) {
        const dateTime = interaction.options.getString('datetime');
        const message = interaction.options.getString('message');

        // 檢查輸入格式
        const fullDateTime = moment(dateTime, 'YYYY/MM/DD HH:mm', true); // 完整日期時間格式
        const timeOnly = moment(dateTime, 'HH:mm', true); // 僅時間格式（每日提醒）

        if (fullDateTime.isValid()) {
            // 單次提醒，特定日期和時間
            const now = moment();
            const delay = fullDateTime.diff(now);

            if (delay <= 0) {
                return interaction.reply({ content: '指定的時間已經過去，請提供未來的時間。', ephemeral: true });
            }

            setTimeout(() => {
                interaction.channel.send(message);
            }, delay);

            await interaction.reply(`已設定單次提醒，將在 ${fullDateTime.format('YYYY/MM/DD HH:mm')} 發送提醒。`);
        } else if (timeOnly.isValid()) {
            // 每日提醒，僅時間
            const [hour, minute] = timeOnly.format('HH:mm').split(':');
            const cronExpression = `${minute} ${hour} * * *`; // 每日的特定時間提醒

            cron.schedule(cronExpression, () => {
                interaction.channel.send(message);
            });

            await interaction.reply(`已設定每日提醒，每天 ${timeOnly.format('HH:mm')} 將發送提醒。`);
        } else {
            await interaction.reply({ content: '無效的時間格式。請使用 "YYYY/MM/DD HH:mm" 或 "HH:mm" 格式。', ephemeral: true });
        }
    },
};