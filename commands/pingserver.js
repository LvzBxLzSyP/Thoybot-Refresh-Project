const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ping = require('ping'); // 確保已安裝 `ping` 模組

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pingserver')
        .setDescription('對指定主機進行延遲測試')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addStringOption(option => 
            option.setName('host')
                .setDescription('請輸入要 Ping 的主機名稱或 IP 地址')
                .setRequired(true))
        .addIntegerOption(option => 
            option.setName('count')
                .setDescription('指定 Ping 的次數（默認為 5）')
                .setRequired(false)),
                
    info: {
        short: '對遠端主機進行延遲測試',
        full: `對遠端主機發送ICMP封包抓取延遲(次數預設為5)
        命令使用語法:
        \`/pingserver <host:IP位址> [count:次數]\`
        使用例:
        \`/pingserver host:192.168.2.100\`
        \`/pingserver host:www.google.com count:5\``
    },

    async execute(interaction) {
        const host = interaction.options.getString('host');
        const count = interaction.options.getInteger('count') || 5;

        // 創建初始嵌入消息
        const embed = new EmbedBuilder()
            .setTitle(`正在 Ping ${host}...`)
            .setDescription('請稍候...')
            .setColor('Random');

        const message = await interaction.reply({ embeds: [embed], fetchReply: true });

        let pingResults = [];
        let successfulPings = 0;
        let failedPings = 0;

        for (let i = 1; i <= count; i++) {
            try {
                const res = await ping.promise.probe(host);
                let currentPing = res.alive ? res.time : '失敗';

                if (res.alive) {
                    successfulPings++;
                    pingResults.push(res.time);
                } else {
                    failedPings++;
                    pingResults.push(null); // 記錄失敗的 ping 次數
                }

                const validPings = pingResults.filter(time => time !== null);
                const maxPing = validPings.length ? Math.max(...validPings) : 'N/A';
                const minPing = validPings.length ? Math.min(...validPings) : 'N/A';
                const avgPing = validPings.length ? (validPings.reduce((a, b) => a + b, 0) / validPings.length).toFixed(2) : 'N/A';

                // 更新嵌入信息
                embed.setDescription(`已完成 ${i}/${count} 次 Ping\n成功: ${successfulPings}, 失敗: ${failedPings}`)
                    .setFields(
                        { name: '目前延遲', value: `${currentPing} ms`, inline: true },
                        { name: '最高延遲', value: `${maxPing} ms`, inline: true },
                        { name: '最低延遲', value: `${minPing} ms`, inline: true },
                        { name: '平均延遲', value: `${avgPing} ms`, inline: true }
                    )
                    .setColor(res.alive ? 'Random' : 'Red');

                // 使用 interaction.editReply 更新嵌入消息
                await interaction.editReply({ embeds: [embed] });

            } catch (error) {
                failedPings++;
                pingResults.push(null); // 記錄發生錯誤的 ping 次數
                embed.setDescription(`已完成 ${i}/${count} 次 Ping\n成功: ${successfulPings}, 失敗: ${failedPings}`)
                    .setColor('Red')
                    .setFooter({ text: '發生錯誤，請檢查主機地址或網絡連接' });

                // 使用 interaction.editReply 更新嵌入消息
                await interaction.editReply({ embeds: [embed] });
                console.error(`Ping error on attempt ${i}:`, error);
            }
        }

        // 統計結果
        const validPings = pingResults.filter(time => time !== null);
        const maxPing = validPings.length ? Math.max(...validPings) : 'N/A';
        const minPing = validPings.length ? Math.min(...validPings) : 'N/A';
        const avgPing = validPings.length ? (validPings.reduce((a, b) => a + b, 0) / validPings.length).toFixed(2) : 'N/A';

        // 最終更新嵌入消息
        embed.setTitle(`Ping ${host} 完成`)
            .setColor(successfulPings === count ? 'Green' : 'Red')
            .setDescription(`共 ${count} 次 Ping\n成功: ${successfulPings}, 失敗: ${failedPings}`)
            .setFields(
                { name: '最高延遲', value: `${maxPing} ms`, inline: true },
                { name: '最低延遲', value: `${minPing} ms`, inline: true },
                { name: '平均延遲', value: `${avgPing} ms`, inline: true }
            );

        // 使用 interaction.editReply 更新最終嵌入消息
        await interaction.editReply({ embeds: [embed] });
    },
};