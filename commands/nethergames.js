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
                await interaction.editReply({ content: 'Error fetching player info. Please try later!' });
            }
            
        } else if (subcmd === 'guild') {
            await interaction.editReply({ content: 'I am not done yet' });
        } else if (subcmd === 'faction') {
            await interaction.editReply({ content: 'I am not done yet' });
        } else {
            await interaction.editReply({ content: 'Subcommand Not Found!' });
        }
    }
};