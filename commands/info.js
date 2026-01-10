const { SlashCommandBuilder, EmbedBuilder, version: discordVersion } = require("discord.js");
const fs = require('fs');
const path = require('path')
const { execSync } = require('child_process');

/**
 * Formats the uptime in a human-readable format (days, hours, minutes, seconds).
 * @param {number} uptime - The uptime of the bot in milliseconds.
 * @returns {string} A formatted string representing the bot's uptime.
 */
function formatUptime(uptime) {
    const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((uptime % (1000 * 60)) / 1000);

    let str = '';
    if (days) str += `${days}d `;
    if (hours) str += `${hours}h `;
    if (minutes) str += `${minutes}m `;
    str += `${seconds}s`;
    return str.trim();
}

function getGitCommit() {
    try {
        const gitDir = path.join(process.cwd(), '.git');
        // Read the branch path pointed to by HEAD
        const head = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
        
        if (head.startsWith('ref: ')) {
            const refPath = head.slice(5);
            // Read the latest commit ID of this branch
            return fs.readFileSync(path.join(gitDir, refPath), 'utf8').trim().substring(0, 7);
        } else {
            // If it's a detached HEAD, then just commit the hash.
            return head.substring(0, 7);
        }
    } catch (err) {
        return 'unknown';
    }
}

const commit = getGitCommit();

module.exports = {
    /**
     * Command data definition
     * @returns {SlashCommandBuilder} The SlashCommandBuilder object defining the structure of the command
     */
    data: new SlashCommandBuilder()
        .setName("info")
        .setNameLocalizations({
            'zh-TW': translate('info', 'zh-TW', 'name')
        })
        .setDescription("Information about the bot")
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),

    /**
     * Command short and full description
     * @type {Object}
     * @property {string} short - A brief description of the command
     * @property {string} full - A detailed description of the command
     */
    info: {
        short: 'Display the bot’s status',
        full: `Displays the bot's current status, such as the mode it's running in, the number of servers, users, commands, uptime, and memory usage.
        Command syntax:
        \`/info\``
    },

    /**
     * Command enable status
     * @type {boolean}
     */
    enabled: true,

    /**
     * Executes the `/info` command logic.
     * @async
     * @function
     * @param {import('discord.js').Interaction} interaction - The interaction object from Discord
     * @returns {Promise<void>} A Promise that resolves with no value
     */
    async execute(interaction) {
        const client = interaction.client;
        const uptime = formatUptime(client.uptime);
        
        // Basic information block
        const isUserMode = !interaction.channel;
        const modeText = isUserMode
            ? `🤖 Install mode: \`USER MODE\``
            : `🤖 Install mode: \`GUILD MODE\`\n🏠 Server Name: ${interaction.guild.name}`;
        const userText = `👤 Command User: ${interaction.user.username}`;
        const basicInfo = `${modeText}\n${userText}`;

        // System information block (shared part)
        const systemInfo = [
            `⏰ Uptime: ${uptime}`,
            `🌐 Servers: ${client.guilds.cache.size}`,
            `👥 Users: ${client.users.cache.size}`,
            `📝 Commands: ${client.commands?.size || 'N/A'}`,
            `📊 Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            `🔧 Discord.js Version: v${discordVersion}`,
            `📌 Bot Version: v${appVer}+${commit}`
        ];
        
        // 檢查是否在Bun環境中運行
        if (typeof Bun !== 'undefined') {
            systemInfo.push(`💻 Node.js Compatible Version: ${process.version}`);
            systemInfo.push(`🟡 Bun Version: v${Bun.version}`);
        } else {
            systemInfo.push(`💻 Node.js Version: ${process.version}`);
        }
        
        const systemInfoResult = systemInfo.join('\n');
        
        const infoEmbed = new EmbedBuilder()
            .setColor(getRandomColor())
            .setAuthor({
                name: 'The ThoyBot Project!',
                iconURL: client.user.displayAvatarURL()
            })
            .addFields(
                {
                    name: '📌 Basic Information',
                    value: basicInfo,
                    inline: false
                },
                {
                    name: '🔧 System Information',
                    value: systemInfoResult,
                    inline: false
                }
            )
            .setThumbnail(client.user.displayAvatarURL())
            .setTimestamp()
            .setFooter({ text: 'Bot by thoy037' });
        
        // Send the reply with the embed
        await interaction.reply({ embeds: [infoEmbed] });
    }
};