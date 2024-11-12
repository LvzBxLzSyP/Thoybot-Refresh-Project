const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("user")
        .setDescription("show detailed user information")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 2)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('What user needs to search')
                .setRequired(true)
        ),
    info: {
        short: '查詢使用者詳細訊息',
        full: `查詢使用者詳細訊息
        命令使用語法:
        \`/user <user:使用者名稱或ID>\`
        使用例:
        \`/user user:@thoy037\`
        \`/user user:707930906983268422\``
    },
    async execute(interaction) {
        let userEmbed;
        const user = interaction.options.getUser('user');
        const createDate = user.createdAt.toLocaleString();
        const accountAge = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)); // Days

        if (!interaction.channel) {
            // DM execution
            userEmbed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setTitle(`👤 User Info: ${user.tag}`)
                .setDescription(`📋 **Basic Information**`)
                .addFields(
                    { name: '🆔 User ID', value: user.id, inline: true },
                    { name: '🤖 Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
                    { name: '📅 Account Created', value: createDate, inline: false },
                    { name: '⏳ Account Age', value: `${accountAge} days`, inline: true },
                    { name: '🖼️ Avatar URL', value: `[Click Here](${user.displayAvatarURL()})`, inline: true }
                )
                .setThumbnail(user.displayAvatarURL())
                .setFooter({
                    text: `Requested By ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });
        } else {
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (member) {
                const joinDate = member.joinedAt.toLocaleString();
                const joinAge = Math.floor((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)); // Days
                const roles = member.roles.cache
                    .filter(role => role.id !== interaction.guild.id) // Exclude @everyone role
                    .map(role => role.toString())
                    .join(', ') || 'No roles';

                userEmbed = new EmbedBuilder()
                    .setColor(getRandomColor())
                    .setTitle(`👤 User Info: ${user.tag}`)
                    .setDescription(`📋 **Basic Information**`)
                    .addFields(
                        { name: '🆔 User ID', value: user.id, inline: true },
                        { name: '🤖 Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
                        { name: '📝 Nickname', value: member.nickname || member.user.username || 'None', inline: true },
                        { name: '📅 Account Created', value: createDate, inline: true },
                        { name: '⏳ Account Age', value: `${accountAge} days`, inline: true },
                        { name: '📥 Server Join Date', value: joinDate, inline: true },
                        { name: '⌛ Time in Server', value: `${joinAge} days`, inline: true },
                        { name: '👑 Highest Role', value: member.roles.highest.toString(), inline: true },
                        { name: '🎨 Role Color', value: member.displayHexColor || 'None', inline: true },
                        { name: '🖼️ Avatar URL', value: `[Click Here](${user.displayAvatarURL()})`, inline: true },
                        { name: '📝 Roles', value: roles, inline: false }
                    )
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({
                        text: `📊 Requested By ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    });
            } else {
                userEmbed = new EmbedBuilder()
                    .setColor(getRandomColor())
                    .setTitle(`👤 User Info: ${user.tag}`)
                    .setDescription(`📋 **Basic Information**`)
                    .addFields(
                        { name: '🆔 User ID', value: user.id, inline: true },
                        { name: '🤖 Bot Account', value: user.bot ? 'Yes' : 'No', inline: true },
                        { name: '📅 Account Created', value: createDate, inline: true },
                        { name: '⏳ Account Age', value: `${accountAge} days`, inline: true },
                        { name: '🖼️ Avatar URL', value: `[Click Here](${user.displayAvatarURL()})`, inline: true },
                        { name: '❌ Server Status', value: 'This user is not in this guild.', inline: false }
                    )
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({
                        text: `📊 Requested By ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    });
            }
        }

        await interaction.reply({ embeds: [userEmbed] });
    }
};