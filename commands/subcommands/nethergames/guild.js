const { EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js');
const { get } = require('axios');
const config = require('../../../config.json');

const headers = {
    'Authorization': config.ngmcApiKey,
    'Content-Type': 'application/json'
};

module.exports = {
    data: new SlashCommandSubcommandBuilder()
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
        ),

    async execute(interaction) {
        const gname = interaction.options.getString('guild');
        const hide = interaction.options?.getBoolean('hide') ?? !interaction.channel;

        await interaction.deferReply({ ephemeral: hide });

        try {
            const { data: results } = await get(`https://api.ngmc.co/v1/guilds/${gname}`, { headers });

            const title = results.rawTag === '' 
  ? `Guild Info: ${results.name}` 
  : `Guild info: ${results.name} (${results.rawTag.slice(2)})`;
            const officers = Array.isArray(results.officers) && results.officers.length > 0 ? results.officers.join(', ') : 'Not fetched';
            let lb = results.position === -1 ? 'This server is not in leaderboard' : results.position <= 10 ? `Top ${results.position?.toString()}` : results.position?.toString();

            const showLink = interaction.options.getBoolean('link') ?? true;
            const dc = results.discordInvite ? `https://discord.gg/${results.discordInvite}` : 'This guild does not have a Discord server';

            const guildEmbed = new EmbedBuilder()
                .setTitle(title)
                .setColor(results.tagColor)
                .addFields(
                    { name: 'MOTD', value: results.motd || 'Guild has not set MOTD, tell officer to set one!' },
                    { name: 'Member Counts', value: results.memberCount?.toString() || 'Not fetched' },
                    { name: 'Leader', value: results.leader || 'Not fetched' },
                    { name: 'Officers', value: officers },
                    { name: 'Leaderboard position', value: lb || 'Not fetched' }
                )
                .setTimestamp()
                .setFooter({ text: 'API by NGMC Official', iconURL: interaction.user.displayAvatarURL() });

            if (showLink) {
                guildEmbed.addFields({ name: 'Discord Invite Link', value: dc });
            }

            await interaction.editReply({ embeds: [guildEmbed] });

        } catch (error) {
            if (error.response?.data?.code === 10006 && error.response?.data?.message === 'Unknown Guild') {
                await interaction.editReply({ content: 'Guild Not Found' });
            } else {
                await interaction.editReply({ content: 'Error fetching guild info. Please try later!' });
            }
        }
    }
};