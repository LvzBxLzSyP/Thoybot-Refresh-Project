const { SlashCommandBuilder } = require('discord.js');
const cron = require('node-cron');
const { DateTime } = require('luxon'); // 引入 Luxon

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcron')
        .setDescription('設置提醒，單次或每日提醒')
        .addStringOption(option => 
            option.setName('datetime')
                .setDescription('請輸入提醒的日期和時間，例如 "2024/11/02 11:40" 或 "11:40" 代表每日提醒')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('message')
                .setDescription('要在指定時間提醒的訊息')
                .setRequired(true)),
    info: {
        short: '設置單次或每日提醒，指定時間與訊息。',
        full: `/addcron <datetime> <message>
設置提醒，您可以設置單次提醒或每日提醒。

參數說明：
- <datetime>：
    - 單次提醒：請輸入具體的日期和時間，格式為 "YYYY/MM/DD HH:mm"。
    - 每日提醒：請只輸入時間，格式為 "HH:mm"。此提醒將每天在指定時間發送。
    例子：
    - 單次提醒：2024/11/02 11:40
    - 每日提醒：11:40

- <message>：您希望在指定時間發送的訊息。

注意：
- 單次提醒會在指定時間發送提醒，若您設置的時間已過，請提供未來的時間。
- 每日提醒會在每一天的指定時間發送提醒。

範例：
1. \`/addcron 2024/11/02 11:40 會議提醒\` — 設置在 2024/11/02 11:40 發送「會議提醒」。
2. \`/addcron 11:40 早安提醒\` — 設置每天 11:40 發送「早安提醒」。`
    },
    enabled: true,
    async execute(interaction) {
        const dateTime = interaction.options.getString('datetime');
        const message = interaction.options.getString('message');

        // 設定為東八區（UTC+8）
        const timezone = 'Asia/Taipei';

        // 檢查輸入格式
        const fullDateTime = DateTime.fromFormat(dateTime, 'yyyy/MM/dd HH:mm', { zone: timezone }); // 完整日期時間格式
        const timeOnly = DateTime.fromFormat(dateTime, 'HH:mm', { zone: timezone }); // 僅時間格式（每日提醒）

        if (fullDateTime.isValid) {
            // 單次提醒，特定日期和時間
            const now = DateTime.now().setZone(timezone); // 當前時間設為東八區
            const delay = fullDateTime.diff(now).milliseconds;

            if (delay <= 0) {
                return interaction.reply({ content: '指定的時間已經過去，請提供未來的時間。', ephemeral: true });
            }

            setTimeout(() => {
                interaction.channel.send(message);
            }, delay);

            await interaction.reply(`已設定單次提醒，將在 ${fullDateTime.toFormat('yyyy/MM/dd HH:mm')} 發送提醒。`);
        } else if (timeOnly.isValid) {
            // 每日提醒，僅時間
            const hour = timeOnly.hour;
            const minute = timeOnly.minute;
            const cronExpression = `${minute} ${hour} * * *`; // 每日的特定時間提醒

            cron.schedule(cronExpression, () => {
                interaction.channel.send(message);
            });

            await interaction.reply(`已設定每日提醒，每天 ${timeOnly.toFormat('HH:mm')} 將發送提醒。`);
        } else {
            await interaction.reply({ content: '無效的時間格式。請使用 "YYYY/MM/DD HH:mm" 或 "HH:mm" 格式。', ephemeral: true });
        }
    },
};