const { SlashCommandSubcommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandSubcommandBuilder()
        .setName('server')
        .setDescription('查詢 Minecraft 伺服器狀態（Java 與 Bedrock）')
        .addStringOption(option =>
            option.setName('host')
                .setDescription('伺服器主機（例如：play.hypixel.net）')
                .setRequired(true)
        ),
    enabled: true,
    async execute(interaction) {
        const host = interaction.options.getString('host');
        await interaction.deferReply();

        let bedrockData = null;
        let javaData = null;

        // 嘗試查詢 Bedrock
        try {
            const { data } = await axios.get(`https://api.mcstatus.io/v2/status/bedrock/${host}`);
            if (data && data.online) bedrockData = data;
        } catch (err) {
            // console.warn("Bedrock 查詢失敗", err.message);
        }

        // 嘗試查詢 Java
        try {
            const { data } = await axios.get(`https://api.mcstatus.io/v2/status/java/${host}`);
            if (data && data.online) javaData = data;
        } catch (err) {
            // console.warn("Java 查詢失敗", err.message);
        }

        // 檢查是否兩個都離線
        if (!bedrockData && !javaData) {
            return interaction.editReply(`❌ 查無伺服器資訊，請確認主機名稱是否正確。\n支援 Java 與 Bedrock 伺服器。`);
        }

        // 設定 embed 標題
        let title = '';
        if (bedrockData && javaData) {
            title = `🟢 Java 與 Bedrock 均在線`;
        } else if (javaData) {
            title = `🟢 Java 在線｜🔴 Bedrock 離線`;
        } else if (bedrockData) {
            title = `🟢 Bedrock 在線｜🔴 Java 離線`;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(`伺服器主機：\`${host}\``)
            .setColor(0x00ccff)
            .setTimestamp();

        // 加入 Bedrock 資訊（若存在）
        if (bedrockData) {
            embed.addFields(
                { name: '🌐 Bedrock IP', value: `${bedrockData.ip_address}:${bedrockData.port}`, inline: true },
                { name: '🎮 玩家數量', value: `${bedrockData.players?.online ?? 0} / ${bedrockData.players?.max ?? '?'}`, inline: true },
                { name: '🧩 版本', value: bedrockData.version?.name || '未知', inline: true },
                { name: '📝 MOTD', value: bedrockData.motd?.clean || '無', inline: false },
                { name: '🕹️ 遊戲模式', value: bedrockData.gamemode || '未知', inline: true },
                { name: '📦 版本類型', value: bedrockData.edition || '未知', inline: true },
                { name: '\u200B', value: '\u200B' } // 分隔區
            );
        }

        // 加入 Java 資訊（若存在）
        if (javaData) {
            embed.addFields(
                { name: '🌐 Java IP', value: `${javaData.ip_address}:${javaData.port}`, inline: true },
                { name: '🎮 玩家數量', value: `${javaData.players?.online ?? 0} / ${javaData.players?.max ?? '?'}`, inline: true },
                { name: '🧩 版本', value: javaData.version?.name_clean || '未知', inline: true },
                { name: '📝 MOTD', value: javaData.motd?.clean || '無', inline: false },
                { name: '🧪 模組數量', value: `${javaData.mods?.length ?? 0}`, inline: true },
                { name: '🔌 插件數量', value: `${javaData.plugins?.length ?? 0}`, inline: true }
            );
        }

        return interaction.editReply({ embeds: [embed] });
    }
};