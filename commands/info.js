const { SlashCommandBuilder, EmbedBuilder, version: discordVersion } = require("discord.js");

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
    
    return `${days}d ${hours}h ${minutes}m ${seconds}s`;
}

module.exports = {
    /**
     * Command data definition
     * @returns {SlashCommandBuilder} The SlashCommandBuilder object defining the structure of the command
     */
    data: new SlashCommandBuilder()
        .setName("info")
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
        let infoEmbed;

        // System information block (shared part)
        const systemInfo = [
            `⏰ Uptime: ${uptime}`,
            `🌐 Servers: ${client.guilds.cache.size}`,
            `👥 Users: ${client.users.cache.size}`,
            `📝 Commands: ${client.commands?.size || 'N/A'}`,
            `📊 Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
            `🔧 Discord.js Version: v${discordVersion}`,
            `📌 Bot Version: v${appVer}`,
            `💻 Node.js Version: ${process.version}`
        ].join('\n');

        // Check if the command was called in a channel
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

        // Send the reply with the embed
        await interaction.reply({ embeds: [infoEmbed] });
    }
};