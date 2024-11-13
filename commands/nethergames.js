const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get } = require('axios');
const config = require('../config.json');

const headers = {
    'Authorization': config.ngmcApiKey,
    'Content-Type': 'application/json'
};

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
        .setName('nethergames')
        .setDescription('Search Nethergames Things')
        .setContexts(0, 1, 2)
        .setIntegrationTypes(0, 1)
        .addSubcommand(subcommand =>
            subcommand
                .setName('player')
                .setDescription('Search Players')
                .addStringOption(option =>
                    option.setName('ign')
                        .setDescription('Minecraft Player In-Game-Name')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('hide')
                        .setDescription('Hiding this message (too long!)')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('guild')
                .setDescription('Search Guild')
                .addStringOption(option =>
                    option.setName('guild')
                        .setDescription('Guild Name')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('hide')
                        .setDescription('Hiding this message (too long!)')
                )
                .addBooleanOption(option =>
                    option.setName('link')
                        .setDescription('Show Discord Guild Link')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('faction')
                .setDescription('Search Faction')
                .addStringOption(option =>
                    option.setName('faction')
                        .setDescription('Faction Name')
                        .setRequired(true)
                )
                .addBooleanOption(option =>
                    option.setName('hide')
                        .setDescription('Hiding this message (too long!)')
                )
        ),
    
    info: {
        short: '從NGMC API查詢玩家、公會及派系',
        full: `利用NetherGames API查詢玩家、公會、派系的簡略資訊
        命令使用語法:
        \`/nethetgames player <ign:遊戲內名稱> [hide:False|True(Guild模式預設false，User模式預設true)]\`
        \`/nethergames guild <guild:公會名稱> [hide:False|True] [showlink:False|True(Guild模式預設true，User模式預設false)]\`
        \`/nethergames faction <faction:派系名稱> [hide:False|True]\`
        
        使用例:
        \`/nethergames player ign:Herobrine90199\`
        \`/nethergames guild guild:MEOWOWO hide:False showlink:False\`
        \`/nethergames faction faction:Fly hide:True\``
    },
    
    async execute(interaction) {
        const subcmd = interaction.options.getSubcommand();
        const hide = interaction.options?.getBoolean('hide') ?? !interaction.channel;

        // 延遲回覆
        await interaction.deferReply({ ephemeral: hide });

        if (subcmd === 'player') {
            const pname = interaction.options.getString('ign');
            try {
                // 獲取玩家數據
                const { data: results } = await get(`https://api.ngmc.co/v1/players/${pname}`, { headers });

                // 創建 Embed
                const playerEmbed = new EmbedBuilder()
                    .setTitle(`Player info: ${pname}`)
                    .setColor(getRandomColor())
                    .addFields(
                        { name: 'Bio', value: results.bio || 'Player has not set bio, tell them to set one!' }
                    )
                    .setThumbnail(results.avatar)
                    .setTimestamp()
                    .setFooter({ text: 'API by NGMC Official', iconURL: interaction.user.displayAvatarURL() });

                // 編輯回覆
                await interaction.editReply({ embeds: [playerEmbed] });

            } catch (error) {
                console.error('Error fetching player info:', error);

                // 判斷是否為 404 錯誤
                if (error.response && error.response.status === 404) {
                    // 玩家未找到
                    await interaction.editReply({ content: 'Player not found' });
                } else {
                    // 其他錯誤
                    await interaction.editReply({ content: 'Error fetching player info. Please try later!' });
                }
            }


        } else if (subcmd === 'guild') {
            const gname = interaction.options.getString('guild');
            const hide = interaction.options?.getBoolean('hide') ?? !interaction.channel;
            
            try {
                const { data: results } = await get(`https://api.ngmc.co/v1/guilds/${gname}`, { headers });
                
                if ( results.rawName = '') {
                    title = `Guild info: ${results.name}`;
                } else {
                        title = `Guild info: ${results.name} (${results.rawTag.slice(2)})`;
    
                    const officers = Array.isArray(results.officers) && results.officers.length > 0
                        ? results.officers.join(', ') // 如果是數組，將成員以逗號分隔
                        : 'Not fetched'; // 若不是數組或無成員，顯示 'Not fetched'
    
                    if ( results.position === -1 ) {
                        lb = 'This server are not in leaderboard'
                    } else if (results.position <= 10) {
                        lb = `Top ${results.position?.toString()}`;
                    } else {
                        lb = results.position?.toString();
                    }
                }

                let showLink = interaction.options.getBoolean('link');

// 如果没有 `interaction.channel`，则默认 showLink 为 false
                if (!interaction.channel) {
                    showLink = showLink === null ? false : showLink;  // 如果 link 选项没有被传递，则默认为 false
                } else {
                    showLink = showLink === null ? true : showLink;  // 如果有频道，默认 showLink 为 true
                }

                if (results.discordInvite === null) {
                    dc = 'This guild do not have discord server'
                } else {
                    dc = `https://discord.gg/${results.discordInvite}`
                }

                let guildEmbed = new EmbedBuilder()
                    .setTitle(title)
                    .setColor(results.tagColor)
                    .addFields(
                        { name: 'MOTD', value: results.motd || 'Guild has not set MOTD, tell officer to set one!' },
                        { name: 'Member Counts', value: results.memberCount?.toString() || 'Not fetched' },
                        { name: 'Leader', value: results.leader || 'Not fetched' },
                        { name: 'Officers', value: (results.officers && results.officers.length > 0) ? results.officers.join(', ') : 'No officers available' },
                        { name: 'Members', value: (results.members && results.members.length > 0) ? results.members.join(', ') : 'No members available' },
                        { name: 'Leaderboard position', value: lb || 'Not fetched' }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'API by NGMC Official', iconURL: interaction.user.displayAvatarURL() });

// 如果需要，添加 Discord 邀请链接
                if (showLink) {
                    guildEmbed.addFields({ name: 'Discord Invite Link', value: dc });
                }

                await interaction.editReply({ embeds: [guildEmbed] });

            } catch (error) {
                if (error.response) {
                    // 輸出錯誤的詳細資訊
                    console.error('Error response data:', error.response.data);
                    console.error('Error response status:', error.response.status);
                } else {
                    // 輸出錯誤訊息
                    console.error('Error message:', error.message);
                }

                // 如果錯誤是「Unknown Guild」訊息
                if (error.response?.data?.code === 10006 && error.response?.data?.message === 'Unknown Guild') {
                    await interaction.editReply({ content: 'Guild Not Found' });
                } else if (error.message === 'Message was blocked by AutoMod') {
                    await interaction.editReply({content: 'Message was blocked by AutoMod'});
                } else {
                    await interaction.editReply({ content: 'Error fetching guild info. Please try later!' });
                }
            }
        } else if (subcmd === 'faction') {
            await interaction.editReply({ content: 'I am not done yet' });
        } else {
            await interaction.editReply({ content: 'Subcommand Not Found!' });
        }
    }
};