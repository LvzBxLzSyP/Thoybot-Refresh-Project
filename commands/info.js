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
        .setName("info")
        .setDescription("Information about the bot")
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1),
    async execute(interaction) {
        let infoEmbed;

        // 检查是否在频道中调用
        if (!interaction.channel) {
            infoEmbed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setTitle('The ThoyBot Project!')
                .setDescription(`There is some info for this bot:\nInstall mode: \`USER MODE\`\nCommand User: ${interaction.user.username}`)
                .setTimestamp()
                .setFooter({ text: 'Bot by thoy037' });
        } else {
            infoEmbed = new EmbedBuilder()
                .setColor(getRandomColor())
                .setTitle('The ThoyBot Project!')
                .setDescription(`There is some info for this bot:\nInstall mode: \`GUILD MODE\`\nServer Name: ${interaction.guild.name}\nCommand User: ${interaction.user.username}`)
                .setTimestamp()
                .setFooter({ text: 'Bot by thoy037' });
        }

        // 回复信息
        await interaction.reply({ embeds: [infoEmbed] });
    }
}