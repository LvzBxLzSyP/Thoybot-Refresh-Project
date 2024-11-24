const { EmbedBuilder, SlashCommandSubcommandBuilder } = require('discord.js');
const { get } = require('axios');
const config = require('../../../config.json');

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
    data: new SlashCommandSubcommandBuilder()
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
        ),
    enabled: true,
    async execute(interaction) {
        const pname = interaction.options.getString('ign');
        const hide = interaction.options?.getBoolean('hide') ?? !interaction.channel;

        await interaction.deferReply({ ephemeral: hide });

        try {
            const { data: results } = await get(`https://api.ngmc.co/v1/players/${pname}`, { headers });

            const playerEmbed = new EmbedBuilder()
                .setTitle(`Player info: ${pname}`)
                .setColor(getRandomColor())
                .addFields(
                    { name: 'Bio', value: results.bio || 'Player has not set bio, tell them to set one!' }
                )
                .setThumbnail(results.avatar)
                .setTimestamp()
                .setFooter({ text: 'API by NGMC Official', iconURL: interaction.user.displayAvatarURL() });

            await interaction.editReply({ embeds: [playerEmbed] });

        } catch (error) {
            console.error('Error fetching player info:', error);
            if (error.response && error.response.status === 404) {
                await interaction.editReply({ content: 'Player not found' });
            } else {
                await interaction.editReply({ content: 'Error fetching player info. Please try later!' });
            }
        }
    }
};