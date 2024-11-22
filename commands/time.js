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
    return timezonesOnPage.map(tz => {
        const time = moment.tz(tz);
        const emoji = getClockEmoji(time); // 根據當地時間選擇時鐘 emoji
        return {
            name: `${tz}`, // 顯示時鐘 emoji 和時區
            value: time.format(`${emoji} YYYY-MM-DD HH:mm:ss`),
            inline: false, // 確保每個欄位顯示在單獨的行
        };
    });
};

// 選擇對應的時鐘 emoji
function getClockEmoji(time) {
    const clockEmojis = [
        '🕛', '🕧', '🕐', '🕜', '🕑', '🕝', '🕒', '🕞', '🕓', '🕟', '🕔', '🕠',
        '🕕', '🕡', '🕖', '🕢', '🕗', '🕣', '🕘', '🕤', '🕙', '🕥', '🕚', '🕦'
    ];
    const hour = time.hours() % 12; // 取 12 小時制
    const halfHour = time.minutes() >= 30 ? 1 : 0; // 判斷是否過半小時
    const emojiIndex = hour * 2 + halfHour; // 計算 emoji 索引
    return clockEmojis[emojiIndex];
}

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

function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// 定義 `/time` 命令，使用 SlashCommandBuilder
module.exports = {
    data: new SlashCommandBuilder()
        .setName('time')
        .setDescription('顯示世界各地的時間')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addStringOption(option =>
            option.setName('timezone')
                .setDescription('顯示特定時區 (例如：Asia/Taipei)')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('ephemeral')
                .setDescription('是否顯示臨時訊息')
                .setRequired(false)
        ),
    info: {
        short: '顯示世界各地的時間',
        full: `顯示所有被 IANA 定義的時區
        命令使用語法:
        \`/time\`
        或顯示指定時區: \`/time timezone:<時區>\``
    },
    async execute(interaction) {
        const defaultEphemeral = interaction.channel ? false : true;
        const ephemeral = interaction.options.getBoolean('ephemeral') ?? defaultEphemeral;
        const specifiedTimezone = interaction.options.getString('timezone');

        // 啟用 deferReply 以延遲回應，避免 Unknown Interaction 錯誤
        await interaction.deferReply({ ephemeral });

        const timezones = moment.tz.names();

        // 如果使用者指定了時區，直接顯示該時區的時間
        if (specifiedTimezone) {
            if (!timezones.includes(specifiedTimezone)) {
                return interaction.editReply({
                    content: `無效的時區名稱：\`${specifiedTimezone}\`，請輸入正確的時區名稱！`,
                });
            }

            const timeInSpecifiedZone = moment.tz(specifiedTimezone);
            const emoji = getClockEmoji(timeInSpecifiedZone); // 根據指定的時區時間選擇時鐘 emoji
            const embed = new EmbedBuilder()
                .setTitle(`時區：${specifiedTimezone}`)
                .setDescription(`目前時間：${emoji} ${timeInSpecifiedZone.format('YYYY-MM-DD HH:mm:ss')}`)
                .setColor(getRandomColor());

            return interaction.editReply({ embeds: [embed] });
        }

        // 沒有指定時區，顯示預設分頁
        const totalPages = Math.ceil(timezones.length / ITEMS_PER_PAGE);
        const currentPage = 0;

        const embed = new EmbedBuilder()
            .setTitle('世界各地的時間')
            .setDescription(`這是第 1 頁，共 ${totalPages} 頁:`)
            .setColor(getRandomColor())
            .addFields(getTimezoneFields(currentPage));

        await interaction.editReply({
            embeds: [embed],
            components: [createButtons(currentPage, totalPages)],
        });
    },
};