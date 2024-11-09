const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { get } = require('axios');
const config = require('../config.json');

const headers = {
    'Authorization': config.ngmcApiKey,
    'Content-Type': 'application/json'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nethergames')
        .setDescription('Search Nethergames Things')
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
    
    async execute(interaction) {
        const subcmd = interaction.options.getSubcommand();
        const hide = interaction.options.getBoolean('hide') && !interaction.channel; // 隐藏选项或私信情况
        
        if (subcmd === 'player') {
            const pname = interaction.options.getString('ign');
            try {
                // 获取玩家数据
                const { data: results } = await get(`https://api.ngmc.co/v1/players/${pname}`, { headers });
                
                // 创建 Embed
                const playerEmbed = new EmbedBuilder()
                    .setTitle(`Player info: ${pname}`)
                    .addFields(
                        { name: 'Bio', value: results.bio || 'Player has not set bio, tell them to set one!' }
                    )
                    .setThumbnail(results.avatar)
                    .setTimestamp()
                    .setFooter({ text: 'API by NGMC Official', iconURL: interaction.user.displayAvatarURL() });
                
                // 根据隐藏选项显示消息
                await interaction.reply({ embeds: [playerEmbed], ephemeral: hide });
                
            } catch (error) {
                console.error('Error fetching player info:', error);
                await interaction.reply({ content: 'Error fetching player info. Please try later!', ephemeral: true });
            }
            
        } else if (subcmd === 'guild') {
            await interaction.reply({ content: 'I am not done yet', ephemeral: true });
        } else if (subcmd === 'faction') {
            await interaction.reply({ content: 'I am not done yet', ephemeral: true });
        } else {
            await interaction.reply({ content: 'Subcommand Not Found!', ephemeral: true });
        }
    }
};