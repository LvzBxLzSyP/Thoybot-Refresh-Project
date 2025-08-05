const { SlashCommandSubcommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('server')
        .setDescription('Query Minecraft server status (Java & Bedrock)')
        .addStringOption(option =>
            option.setName('host')
                .setDescription('Server host (e.g., play.hypixel.net)')
                .setRequired(true)
        ),
    enabled: true,

    async execute(interaction) {
        const host = interaction.options.getString('host');
        await interaction.deferReply();

        let bedrockData = null;
        let javaData = null;

        // 查詢 Bedrock
        try {
            const { data } = await axios.get(`https://api.mcstatus.io/v2/status/bedrock/${host}`);
            if (data && data.online) bedrockData = data;
        } catch (err) {}

        // 查詢 Java
        try {
            const { data } = await axios.get(`https://api.mcstatus.io/v2/status/java/${host}`);
            if (data && data.online) javaData = data;
        } catch (err) {}

        let title = '';
        if (bedrockData && javaData) {
            title = `🟢 Java & Bedrock Online`;
        } else if (javaData) {
            title = `🟢 Java Online｜🔴 Bedrock Offline`;
        } else if (bedrockData) {
            title = `🟢 Bedrock Online｜🔴 Java Offline`;
        } else {
            title = `🔴 Java & Bedrock Offline`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`Server Host: \`${host}\``)
            .setColor(0x00ccff)
            .setTimestamp();

        // 加入 Bedrock 資訊（如果有）
        if (bedrockData) {
            embed.addFields(
                { name: '🌐 Bedrock IP', value: `${bedrockData.ip_address}:${bedrockData.port}`, inline: true },
                { name: '🎮 Players', value: `${bedrockData.players?.online ?? 0} / ${bedrockData.players?.max ?? '?'}`, inline: true },
                { name: '🧩 Version', value: bedrockData.version?.name || 'Unknown', inline: true },
                { name: '📝 MOTD', value: bedrockData.motd?.clean || 'None', inline: false },
                { name: '🕹️ Game Mode', value: bedrockData.gamemode || 'Unknown', inline: true },
                { name: '📦 Edition', value: bedrockData.edition || 'Unknown', inline: true }
            );
        }

        // 加入 Java 資訊（如果有）
        if (javaData) {
            embed.addFields(
                { name: '🌐 Java IP', value: `${javaData.ip_address}:${javaData.port}`, inline: true },
                { name: '🎮 Players', value: `${javaData.players?.online ?? 0} / ${javaData.players?.max ?? '?'}`, inline: true },
                { name: '🧩 Version', value: javaData.version?.name_clean || 'Unknown', inline: true },
                { name: '📝 MOTD', value: javaData.motd?.clean || 'None', inline: false },
                { name: '🧪 Mods', value: `${javaData.mods?.length ?? 0}`, inline: true },
                { name: '🔌 Plugins', value: `${javaData.plugins?.length ?? 0}`, inline: true }
            );
        }

        const files = [];

        // 如果 Java 有 icon，則解析並附加
        if (javaData?.icon) {
            try {
                const matches = javaData.icon.match(/^data:(.+);base64,(.+)$/);
                if (matches) {
                    const mimeType = matches[1];  // e.g., image/png
                    const base64Data = matches[2];
                    const ext = mimeType.split('/')[1]; // png, jpeg, etc.
                    const buffer = Buffer.from(base64Data, 'base64');
                    const filename = `java-icon.${ext}`;

                    const attachment = new AttachmentBuilder(buffer, { name: filename });
                    files.push(attachment);

                    embed.setThumbnail(`attachment://${filename}`);
                }
            } catch (err) {
                console.warn('無法解析 Java icon：', err.message);
            }
        }

        return interaction.editReply({ embeds: [embed], files });
    }
};