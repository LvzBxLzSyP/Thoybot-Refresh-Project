const { Client, Collection, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, REST, Routes } = require('discord.js');
const moment = require('moment-timezone');
const config = require('./config.json');
const fs = require('fs');

const ITEMS_PER_PAGE = 25; // 每頁顯示25個時區

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

global.client = client;

client.commands = new Collection();
client.commandInfo = {}; // 用來存儲每個命令的info

const loadCommands = () => {
    const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

    const commands = [];
    for (const file of commandFiles) {
        try {
            const command = require(`./commands/${file}`);

            if (!command || !command.data || !command.data.name) {
                console.warn(`Warning: Command file ${file} is missing 'data' or 'name'. Skipping this file.`);
                continue;
            }

            client.commands.set(command.data.name, command);
            commands.push(command.data.toJSON());

            // 如果存在 command.info，將其加入 client.commandInfo 中
            if (command.info) {
                client.commandInfo[command.data.name] = command.info;
                console.log(client.commandInfo);
            }

        } catch (error) {
            console.error(`Error loading command file ${file}:`, error);
        }
    }

    return commands;
};

// 註冊斜線命令
const registerSlashCommands = async (commands) => {
    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
        console.log('Started refreshing application (/) commands.');
        await rest.put(Routes.applicationCommands(config.clientId), { body: commands });
        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error('Failed to register slash commands:', error);
    }
};

// 計算時區訊息
const getTimezoneMessage = (page) => {
    const timezones = moment.tz.names();
    const ITEMS_PER_PAGE = 25;
    const startIndex = page * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const timezonesOnPage = timezones.slice(startIndex, endIndex);

    const timezonesList = timezonesOnPage.map(tz => `${tz}: ${moment.tz(tz).format('YYYY-MM-DD HH:mm:ss')}`).join('\n');
    return timezonesList;
};

const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
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

// 初始化機器人
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // 註冊斜線命令
    const commands = loadCommands();
    await registerSlashCommands(commands);
});

// 監聽交互事件
client.on('interactionCreate', async (interaction) => {
    // 處理斜線命令
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);

        if (!command) return;
    
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
    
            // 如果已經回應過互動，則使用 editReply() 來處理錯誤消息
            if (interaction.replied) {
                await interaction.editReply({ content: '發生錯誤，請稍後再試！', ephemeral: true });
            } else {
                // 否則，回應新的錯誤消息
                await interaction.reply({ content: '發生錯誤，請稍後再試！', ephemeral: true });
            }
        }
    }

    // 處理按鈕交互
    if (interaction.isButton()) {
        if (!interaction.customId.startsWith('time_')) return; // 確保是time相關的按鈕
        
        await interaction.deferUpdate();
        
        let currentPage = parseInt(interaction.customId.split('_')[2]);  // 正確解析頁數
    
        const timezones = moment.tz.names();
        const totalPages = Math.ceil(timezones.length / ITEMS_PER_PAGE); // 每頁顯示25個時區
    
        // 根據按鈕類型更新頁面
        if (interaction.customId.includes('previous') && currentPage > 0) {
            currentPage--;  // 點擊「上一頁」
        } else if (interaction.customId.includes('next') && currentPage < totalPages - 1) {
            currentPage++;  // 點擊「下一頁」
        }
    
        // 創建並準備嵌入
        const embed = new EmbedBuilder()
            .setTitle('世界各地的時間')
            .setDescription(`這是第 ${currentPage + 1} 頁，共 ${totalPages} 頁:`)
            .setColor('#00FF00');
    
        // 添加每個時區為單獨的欄位
        embed.addFields(timezones.slice(currentPage * ITEMS_PER_PAGE, (currentPage + 1) * ITEMS_PER_PAGE)
            .map(tz => ({
                name: tz,
                value: moment.tz(tz).format('YYYY-MM-DD HH:mm:ss'),
                inline: false,
            }))
        );
    
        // 使用 editReply 更新回應
        await interaction.editReply({
            embeds: [embed],
            components: [createButtons(currentPage, totalPages)],
        });
    }

    // 處理下拉選單交互（幫助命令）
    else if (interaction.isStringSelectMenu()) {
        if (interaction.customId !== 'help_menu') return;

        const selectedCommand = interaction.values[0];

        // 關閉選單
        if (selectedCommand === 'close') {
            await interaction.update({ content: 'Select menu closed', components: [] });
            await interaction.followUp({ content: 'Select menu closed', ephemeral: true});
            return;
        }

        // 顯示選擇的指令信息
        const command = client.commands.get(selectedCommand);
        if (command) {
            const commandInfo = client.commandInfo[selectedCommand];
            const commandEmbed = new EmbedBuilder()
                .setTitle(`Command: ${selectedCommand}`)
                .setDescription(commandInfo?.full || command.data.description || 'No detailed information available')
                .setColor(getRandomColor());

            await interaction.deferUpdate();
            await interaction.followUp({ embeds: [commandEmbed], ephemeral: true });
        }
    }
});

// 登入機器人
client.login(config.token);

// 加載事件處理器
const loadEvents = () => {
    const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

    for (const file of eventFiles) {
        const event = require(`./events/${file}`);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args, client));
        } else {
            client.on(event.name, (...args) => event.execute(...args, client));
        }
    }
};

loadEvents();