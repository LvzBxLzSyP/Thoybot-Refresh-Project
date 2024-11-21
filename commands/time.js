const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const moment = require('moment-timezone');

const ITEMS_PER_PAGE = 25; // 每頁顯示25個時區

// 計算時區訊息
const getTimezoneFields = (page) => {
    const timezones = moment.tz.names();
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const timezonesOnPage = timezones.slice(startIndex, endIndex);

    // 使用 addFields 來為每個時區創建一個欄位
    return timezonesOnPage.map(tz => ({
        name: tz,
        value: moment.tz(tz).format('YYYY-MM-DD HH:mm:ss'),
        inline: false, // 確保每個欄位顯示在單獨的行
    }));
};

// 創建按鈕
const createButtons = (page, totalPages) => {
    return new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`time_previous_${page}`)
                .setLabel('上一頁')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === 0),
            new ButtonBuilder()
                .setCustomId(`time_next_${page}`)
                .setLabel('下一頁')
                .setStyle(ButtonStyle.Primary)
                .setDisabled(page === totalPages - 1)
        );
};

// 定義 `/time` 命令，使用 SlashCommandBuilder
module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('顯示世界各地的時間'),
    info: {
        short: '顯示世界各地的時間',
        full: `顯示所有被IANA定義的時區
        命令使用語法:
        \`/time\``
    },
    async execute(interaction) {
        // 啟用 deferReply 以延遲回應，避免 Unknown Interaction 錯誤
        await interaction.deferReply();

        const timezones = moment.tz.names();
        const totalPages = Math.ceil(timezones.length / ITEMS_PER_PAGE);

        // 默認顯示第一頁的時區
        const currentPage = 0;

        // 創建並準備嵌入
        const embed = new EmbedBuilder()
            .setTitle('世界各地的時間')
            .setDescription(`這是第 1 頁，共 ${totalPages} 頁:`)
            .setColor('#00FF00');

        // 添加每個時區為單獨的欄位
        embed.addFields(getTimezoneFields(currentPage));

        // 發送回應
        await interaction.editReply({
            embeds: [embed],
            components: [createButtons(currentPage, totalPages)],
        });
    },
};