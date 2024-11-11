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
        .setDescription("show user")
        .setIntegrationTypes(0, 1)
        .setContexts(0, 2)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('What user needs to search')
                .setRequired(true)
        ),
    info: {
        short: '查詢使用者訊息',
        full: `查詢使用者訊息
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

        if (!interaction.channel) {
            // 如果在 DM 中執行
            userEmbed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setTitle(`User info: ${user.tag}`)
                .setDescription(`User account creation date: ${createDate}`)
                .setThumbnail(user.displayAvatarURL())
                .setFooter({
                    text: `Requested By ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });
        } else {
            // 檢查用戶是否在伺服器中
            const member = await interaction.guild.members.fetch(user.id).catch(() => null);

            if (member) {
                // 用戶在伺服器中
                const joinDate = member.joinedAt ? member.joinedAt.toLocaleString() : 'Unknown';
                userEmbed = new EmbedBuilder()
                    .setColor(getRandomColor())
                    .setTitle(`User info: ${user.tag}`)
                    .setDescription(`User account creation date: ${createDate}\nUser join guild date: ${joinDate}`)
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({
                        text: `Requested By ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    });
            } else {
                // 用戶不在伺服器中
                userEmbed = new EmbedBuilder()
                    .setColor(getRandomColor())
                    .setTitle(`User info: ${user.tag}`)
                    .setDescription(`User account creation date: ${createDate}\nThis user is not in this guild.`)
                    .setThumbnail(user.displayAvatarURL())
                    .setFooter({
                        text: `Requested By ${interaction.user.username}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    });
            }
        }

        // 最後發送 embed 作為回應
        await interaction.reply({ embeds: [userEmbed] });
    }
};