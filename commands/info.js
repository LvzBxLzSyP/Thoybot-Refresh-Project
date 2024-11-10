const { SlashCommandBuilder, EmbedBuilder, version: discordVersion } = require("discord.js");

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function formatUptime(uptime) {
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("info")
        .setDescription("Information about the bot")
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    async execute(interaction) {
        const client = interaction.client;
        const botVersion = "0.2.0"; // 你的機器人版本
        const uptime = formatUptime(client.uptime);
        let infoEmbed;

        // 系統信息區塊 (共用部分)
        const systemInfo = [
            `⏰ Uptime: ${uptime}`,
            `🌐 Servers: ${client.guilds.cache.size}`,
            `👥 Users: ${client.users.cache.size}`,
            `📝 Commands: ${client.commands?.size || 'N/A'}`,
            `📊 Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            `🔧 Discord.js: v${discordVersion}`,
            `📌 Bot Version: v${botVersion}`
        ].join('\n');

        // 檢查是否在頻道中調用
        if (!interaction.channel) {
            infoEmbed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setAuthor({ 
                    name: 'The ThoyBot Project!',
                    iconURL: client.user.displayAvatarURL()
                })
                .addFields(
                    { 
                        name: '📌 Basic Information', 
                        value: `🤖 Install mode: \`USER MODE\`\n👤 Command User: ${interaction.user.username}`, 
                        inline: false 
                    },
                    { name: '🔧 System Information', value: systemInfo, inline: false }
                )
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Bot by thoy037' });
        } else {
            infoEmbed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setAuthor({ 
                    name: 'The ThoyBot Project!',
                    iconURL: client.user.displayAvatarURL()
                })
                .addFields(
                    { 
                        name: '📌 Basic Information', 
                        value: `🤖 Install mode: \`GUILD MODE\`\n🏠 Server Name: ${interaction.guild.name}\n👤 Command User: ${interaction.user.username}`, 
                        inline: false 
                    },
                    { name: '🔧 System Information', value: systemInfo, inline: false }
                )
                .setThumbnail(client.user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Bot by thoy037' });
        }

        // 回复信息
        await interaction.reply({ embeds: [infoEmbed] });
    }
};